#!/usr/bin/env node
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function run(cmd, opts = {}) {
  const options = { stdio: "pipe", encoding: "utf8", ...opts };
  return execSync(cmd, options).toString().trim();
}

function runJson(cmd) {
  const out = run(cmd);
  try {
    return JSON.parse(out);
  } catch (e) {
    throw new Error(`Failed to parse JSON from: ${cmd}\nOutput: ${out}`);
  }
}

function ensureGh() {
  try {
    run("gh --version");
  } catch {
    console.error(
      "GitHub CLI (gh) is required. Install: https://cli.github.com/"
    );
    process.exit(1);
  }
}

function getRepoSlug() {
  try {
    const out = run("gh repo view --json nameWithOwner --jq .nameWithOwner");
    return out;
  } catch {
    return null; // directory context should suffice
  }
}

function getExistingLabels() {
  try {
    const json = run("gh label list --json name");
    const arr = JSON.parse(json);
    return new Set(arr.map((x) => x.name));
  } catch (e) {
    console.warn(
      "Warning: could not list labels via gh. Proceeding optimistically."
    );
    return new Set();
  }
}

function createLabel(name, { color = "ededed", description = "" } = {}) {
  try {
    run(
      `gh label create ${shellEscape(name)} --color ${shellEscape(color)} ${
        description ? `--description ${shellEscape(description)}` : ""
      }`
    );
    return true;
  } catch (e) {
    const msg = e?.stderr?.toString?.() || e?.message || "";
    if (msg.includes("already exists")) return false;
    // fall back: try update to set color/description if label exists
    try {
      run(
        `gh label edit ${shellEscape(name)} --color ${shellEscape(color)} ${
          description ? `--description ${shellEscape(description)}` : ""
        }`
      );
      return false;
    } catch {
      console.warn(`Label '${name}': ${msg || "unknown error"}`);
      return false;
    }
  }
}

function issueExistsByTitle(title) {
  try {
    const json = run(
      `gh issue list --state all --search ${shellEscape(
        `in:title ${title}`
      )} --limit 1 --json number,title`
    );
    const arr = JSON.parse(json);
    return Array.isArray(arr) && arr.some((it) => it.title === title);
  } catch {
    return false;
  }
}

function getIssueByTitle(title) {
  try {
    const json = run(
      `gh issue list --state all --search ${shellEscape(
        `in:title ${title}`
      )} --limit 1 --json number,title,url,labels`
    );
    const arr = JSON.parse(json);
    if (Array.isArray(arr)) {
      const found = arr.find((it) => it.title === title);
      if (found) return found;
    }
    return null;
  } catch {
    return null;
  }
}

function createIssue({ title, body, labels = [] }) {
  const labelFlags = labels.map((l) => `--label ${shellEscape(l)}`).join(" ");
  const cmd = `gh issue create --title ${shellEscape(title)} ${
    body ? `--body ${shellEscape(body)}` : ""
  } ${labelFlags}`;
  return run(cmd, { stdio: "pipe" });
}

function shellEscape(str) {
  if (str === undefined || str === null) return "''";
  // Simple POSIX-safe single-quote escaping
  return `'${String(str).replace(/'/g, "'\\''")}'`;
}

function getArrayFrom(resp, key) {
  if (Array.isArray(resp)) return resp;
  if (resp && Array.isArray(resp[key])) return resp[key];
  return [];
}

async function main() {
  ensureGh();
  const repo = getRepoSlug();
  if (repo) {
    console.log(`Using repository: ${repo}`);
  }

  const issuesPath = path.join(repoRoot, "issues.yml");
  const file = readFileSync(issuesPath, "utf8");
  const docs = yaml.load(file);
  if (!Array.isArray(docs)) {
    console.error("issues.yml must be a YAML array of issue objects");
    process.exit(1);
  }

  const PHASE_LABELS = {
    "phase-0": { color: "915FEE", description: "Phase 0 – MVP Go Live" },
    "phase-1": { color: "0EA5E9", description: "Phase 1" },
    "phase-2": { color: "84CC16", description: "Phase 2" },
    "phase-3": { color: "F59E0B", description: "Phase 3" },
    "phase-4": { color: "EF4444", description: "Phase 4" },
    "phase-5": { color: "64748B", description: "Phase 5" },
  };

  const existing = getExistingLabels();

  // Ensure labels exist
  const neededLabels = new Set();
  for (const item of docs) {
    if (Array.isArray(item.labels)) {
      item.labels.forEach((l) => neededLabels.add(l));
    }
  }

  const created = [];
  for (const name of neededLabels) {
    if (!existing.has(name)) {
      const cfg = PHASE_LABELS[name] || { color: "ededed", description: "" };
      const wasCreated = createLabel(name, cfg);
      if (wasCreated) created.push(name);
    }
  }
  if (created.length) console.log(`Created labels: ${created.join(", ")}`);

  // Create issues if not present; collect all (existing + created)
  let createdIssues = 0;
  const issueEntries = [];
  for (const item of docs) {
    const { title, body, labels = [] } = item;
    if (!title) continue;
    const existing = getIssueByTitle(title);
    if (existing) {
      issueEntries.push({ url: existing.url, labels });
      console.log(`Skip existing issue: ${title}`);
      continue;
    }
    const url = createIssue({ title, body, labels });
    createdIssues += 1;
    issueEntries.push({ url, labels });
    console.log(`Created: ${title} -> ${url}`);
  }

  // Optionally add issues to a GitHub Project (Project v2)
  // Determine project owner and number
  let projectOwner = process.env.GH_PROJECT_OWNER || "";
  let projectNumber = process.env.GH_PROJECT_NUMBER || "";
  const projectTitle = process.env.GH_PROJECT_TITLE || "DeelRxCRM Roadmap";
  const phaseFieldName = process.env.GH_PROJECT_PHASE_FIELD || "Phase";

  try {
    if (!projectOwner) {
      const repoInfo = runJson("gh repo view --json owner");
      projectOwner = repoInfo?.owner?.login || "";
    }
  } catch {
    // ignore, may not be in a gh repo context
  }

  // If number not provided, try to find by title
  if (projectOwner && !projectNumber && projectTitle) {
    try {
      const plist = runJson(
        `gh project list --owner ${shellEscape(projectOwner)} --format json`
      );
      const match = Array.isArray(plist)
        ? plist.find((p) => p.title === projectTitle)
        : null;
      if (match?.number) projectNumber = String(match.number);
      if (!projectNumber && process.env.GH_PROJECT_CREATE === "1") {
        const created = runJson(
          `gh project create --owner ${shellEscape(
            projectOwner
          )} --title ${shellEscape(projectTitle)} --format json`
        );
        if (created?.number) {
          projectNumber = String(created.number);
          console.log(`Created project '${projectTitle}' (#${projectNumber}).`);
        }
      }
    } catch (e) {
      // proceed if can't list or create
    }
  }

  if (projectOwner && projectNumber) {
    try {
      const projectView = runJson(
        `gh project view ${projectNumber} --owner ${shellEscape(
          projectOwner
        )} --format json`
      );
      const projectId = projectView?.id;
      if (!projectId) throw new Error("Project not found");

      let fields = [];
      try {
          const fieldsResp = runJson(
            `gh project field-list ${projectNumber} --owner ${shellEscape(
              projectOwner
            )} --format json`
          );
          fields = getArrayFrom(fieldsResp, 'fields');
      } catch {
        fields = [];
      }
      let phaseField = Array.isArray(fields)
        ? fields.find((f) => f.name === phaseFieldName)
        : null;
      let phaseFieldId = phaseField?.id;
      let phaseFieldType = phaseField?.dataType || null;
      // gh field-list returns 'type' like 'ProjectV2SingleSelectField' or 'ProjectV2Field'
      if (!phaseFieldType && phaseField?.type) {
        if (String(phaseField.type).includes('SingleSelect')) phaseFieldType = 'SINGLE_SELECT';
        else if (String(phaseField.type).includes('Text')) phaseFieldType = 'TEXT';
      }
      let phaseOptions = phaseField?.options || [];

      console.log(
        `Project field: ${phaseFieldName} -> ${phaseFieldId ? 'found' : 'missing'}, type=${phaseFieldType || 'unknown'}, options=${Array.isArray(phaseOptions) ? phaseOptions.length : 0}`
      );

      // If Phase field missing and allowed to create, create it with options Phase 0..5
      if (!phaseFieldId && process.env.GH_PROJECT_ENSURE_PHASE !== "0") {
        const optionsCsv = [
          "Phase 0",
          "Phase 1",
          "Phase 2",
          "Phase 3",
          "Phase 4",
          "Phase 5",
        ].join(",");
        try {
          const createdField = runJson(
            `gh project field-create ${projectNumber} --owner ${shellEscape(
              projectOwner
            )} --name ${shellEscape(
              phaseFieldName
            )} --data-type SINGLE_SELECT --single-select-options ${shellEscape(
              optionsCsv
            )} --format json`
          );
          phaseFieldId = createdField?.id || null;
          // Reload fields to get option IDs
          fields = runJson(
            `gh project field-list ${projectNumber} --owner ${shellEscape(
              projectOwner
            )} --format json`
          );
          phaseField = Array.isArray(fields)
            ? fields.find((f) => f.name === phaseFieldName)
            : null;
          phaseFieldType = phaseField?.dataType || null;
          if (!phaseFieldType && phaseField?.type) {
            if (String(phaseField.type).includes('SingleSelect')) phaseFieldType = 'SINGLE_SELECT';
            else if (String(phaseField.type).includes('Text')) phaseFieldType = 'TEXT';
          }
          phaseOptions = phaseField?.options || [];
        } catch (e) {
          const msg = e?.stderr?.toString?.() || e?.message || "";
          if (String(msg).includes("Name has already been taken")) {
            // Field exists; reload to get IDs
            fields = runJson(
              `gh project field-list ${projectNumber} --owner ${shellEscape(
                projectOwner
              )} --format json`
            );
            phaseField = Array.isArray(fields)
              ? fields.find((f) => f.name === phaseFieldName)
              : null;
            phaseFieldId = phaseField?.id || null;
            phaseFieldType = phaseField?.dataType || null;
            if (!phaseFieldType && phaseField?.type) {
              if (String(phaseField.type).includes('SingleSelect')) phaseFieldType = 'SINGLE_SELECT';
              else if (String(phaseField.type).includes('Text')) phaseFieldType = 'TEXT';
            }
            phaseOptions = phaseField?.options || [];
          } else {
            console.warn("Could not create Phase field:", msg || e);
          }
        }
      }

      // If Phase is SINGLE_SELECT but missing options, attempt to seed options
      if (
        phaseFieldId &&
        phaseFieldType === "SINGLE_SELECT" &&
        (!Array.isArray(phaseOptions) || phaseOptions.length === 0)
      ) {
        const optionsCsv = [
          "Phase 0",
          "Phase 1",
          "Phase 2",
          "Phase 3",
          "Phase 4",
          "Phase 5",
        ].join(",");
        try {
          run(
            `gh project field-edit ${projectNumber} --owner ${shellEscape(
              projectOwner
            )} --field-id ${shellEscape(
              phaseFieldId
            )} --single-select-options ${shellEscape(optionsCsv)} --format json`
          );
          // Reload
          fields = runJson(
            `gh project field-list ${projectNumber} --owner ${shellEscape(
              projectOwner
            )} --format json`
          );
          phaseField = Array.isArray(fields)
            ? fields.find((f) => f.name === phaseFieldName)
            : null;
          phaseOptions = phaseField?.options || [];
        } catch (e) {
          console.warn(
            "Could not seed Phase field options:",
            e?.stderr?.toString?.() || e?.message || e
          );
        }
      }

      // Helper to get item id for an issue URL if already present
      const getItemIdForIssue = (issueUrl) => {
        try {
            const itemsResp = runJson(
            `gh project item-list ${projectNumber} --owner ${shellEscape(
              projectOwner
            )} --format json`
          );
            const items = getArrayFrom(itemsResp, 'items');
            const found = items.find((it) => it?.content?.url === issueUrl);
          return found?.id || null;
        } catch {
          return null;
        }
      };

      let addedCount = 0;
      let phaseSetCount = 0;
      for (const { url, labels } of issueEntries) {
        let itemId = null;
        try {
          const added = runJson(
            `gh project item-add ${projectNumber} --owner ${shellEscape(
              projectOwner
            )} --url ${shellEscape(url)} --format json`
          );
          itemId = added?.id || null;
          if (itemId) addedCount += 1;
        } catch (e) {
          // If adding failed (maybe already in project), try to find existing item id
          itemId = getItemIdForIssue(url);
          if (!itemId) {
            const msg =
              e?.stderr?.toString?.() || e?.message || "unknown error";
            console.warn(`Could not add to project: ${url} -> ${msg}`);
          }
        }

        if (itemId && phaseFieldId && Array.isArray(labels)) {
          const phaseLabel = labels.find((n) => /^phase-\d$/.test(n));
          if (phaseLabel) {
            const optionName = `Phase ${phaseLabel.split("-")[1]}`;
            // Debug: show per-item matching
            // eslint-disable-next-line no-console
            console.log(` • Candidate ${url}: label=${phaseLabel}, target=${optionName}`);
            if (phaseFieldType === "SINGLE_SELECT") {
              const option = phaseOptions.find((o) => o.name === optionName);
              if (option) {
                run(
                  `gh project item-edit --id ${shellEscape(
                    itemId
                  )} --project-id ${shellEscape(
                    projectId
                  )} --field-id ${shellEscape(
                    phaseFieldId
                  )} --single-select-option-id ${shellEscape(option.id)}`
                );
                console.log(` • Set ${optionName} for ${url}`);
                phaseSetCount += 1;
              } else {
                console.warn(
                  `Missing option '${optionName}' on field '${phaseFieldName}'.`
                );
              }
            } else if (phaseFieldType === "TEXT") {
              run(
                `gh project item-edit --id ${shellEscape(
                  itemId
                )} --project-id ${shellEscape(
                  projectId
                )} --field-id ${shellEscape(
                  phaseFieldId
                )} --text ${shellEscape(optionName)}`
              );
              console.log(` • Set ${optionName} (text) for ${url}`);
              phaseSetCount += 1;
            } else {
              console.warn(
                `Field '${phaseFieldName}' has unsupported type '${phaseFieldType}'.`
              );
            }
          }
        }
      }
      console.log(
        `Project population summary: added ${addedCount} item(s), set Phase for ${phaseSetCount} item(s).`
      );
    } catch (e) {
      const msg = e?.stderr?.toString?.() || e?.message || e;
      console.warn(`Project population skipped due to error: ${msg}`);
    }
  }

  if (!projectOwner || !projectNumber) {
    console.log(
      "Tip: set GH_PROJECT_OWNER and GH_PROJECT_NUMBER to add items to a GitHub Project."
    );
  }

  console.log(`Done. Created ${createdIssues} new issue(s).`);
}

main().catch((e) => {
  console.error(e?.stderr?.toString?.() || e?.message || e);
  process.exit(1);
});
