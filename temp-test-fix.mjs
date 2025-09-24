
    // Clear API keys to ensure they're not available
    delete process.env.RESEND_API_KEY;
    delete process.env.KNOCK_API_KEY;
    
    console.log('Attempting to import resend module...');
    
    try {
      // Use dynamic import syntax that works with tsx
      Promise.resolve().then(async () => {
        const resendModule = await import('./lib/vendors/resend.ts');
        console.log('✅ Resend module imported successfully without API key!');
        
        // Test that calling a function properly throws error about missing API key
        try {
          await resendModule.sendCreditDueEmail({
            to: ['test@example.com'],
            payload: {
              customerName: 'Test Customer',
              amount: 10000,
              dueDate: '2024-01-01',
              daysOverdue: 5,
              creditId: 'test-123'
            }
          });
          console.log('❌ Function call should have failed');
          process.exit(1);
        } catch (e) {
          if (e.message.includes('RESEND_API_KEY environment variable is required')) {
            console.log('✅ Function properly throws error when API key missing:', e.message);
          } else {
            console.log('❌ Wrong error message:', e.message);
            process.exit(1);
          }
        }
        
        // Test credit module import
        const creditModule = await import('./lib/inngest/functions/credit.ts');
        console.log('✅ Credit module also imported successfully without API key!');
      });
    } catch (e) {
      console.log('❌ Import failed:', e.message);
      process.exit(1);
    }
  