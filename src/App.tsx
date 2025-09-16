import { useEffect, useState } from 'react';

type Attachment = {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  createdAt: string;
};

export default function App() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    fetch('/api/uploads')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load attachments');
        }
        return res.json();
      })
      .then((payload: { attachments: Attachment[] }) => {
        setAttachments(payload.attachments);
      })
      .catch((error: unknown) => {
        console.error(error);
        setStatus('Unable to fetch attachments');
      });
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setStatus('Choose a file before uploading.');
      return;
    }

    try {
      setStatus('Uploading...');
      const body = new FormData();
      body.append('file', selectedFile);

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const payload: { attachment: Attachment } = await response.json();
      setAttachments((current) => [payload.attachment, ...current]);
      setStatus('Upload complete!');
      setSelectedFile(null);
      (event.currentTarget.elements.namedItem('file') as HTMLInputElement).value = '';
    } catch (error) {
      console.error(error);
      setStatus('Upload failed, please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setStatus('Deleting...');
      const response = await fetch(`/api/uploads/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setAttachments((current) => current.filter((item) => item.id !== id));
      setStatus('Attachment deleted.');
    } catch (error) {
      console.error(error);
      setStatus('Unable to delete attachment.');
    }
  };

  return (
    <div className="app-shell">
      <header>
        <h1>DeelRx CRM</h1>
        <p>Upload onboarding files to cloud storage safely.</p>
      </header>

      <section>
        <form onSubmit={handleSubmit}>
          <label htmlFor="file">Choose file</label>
          <input
            id="file"
            name="file"
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setSelectedFile(file ?? null);
            }}
          />
          <button type="submit">Upload</button>
        </form>
        {status && <p className="status">{status}</p>}
      </section>

      <section>
        <h2>Recent uploads</h2>
        <ul>
          {attachments.map((item) => (
            <li key={item.id}>
              <div className="item-row">
                <a href={item.url} target="_blank" rel="noreferrer">
                  {item.filename}
                </a>
                <button type="button" onClick={() => handleDelete(item.id)}>
                  Delete
                </button>
              </div>
              <span className="meta">
                {item.mimeType} • {new Date(item.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
          {attachments.length === 0 && <li>No uploads yet.</li>}
        </ul>
      </section>
    </div>
  );
}
