import { startTunnel } from 'untun';

console.log('🔄 Initializing secure Cloudflare Tunnel for port 5000...');

try {
  const tunnel = await startTunnel({ url: 'http://localhost:5000' });
  const url = await tunnel.getURL();

  console.log('\n======================================================');
  console.log('🎉 PUBLIC LIVE URL FOR YOUR CLIENT:');
  console.log(`👉 ${url}`);
  console.log('======================================================\n');
  console.log('💡 Keep this terminal window open while your client is testing.');
  console.log('Press Ctrl + C anytime to stop the tunnel.');
} catch (err) {
  console.error('❌ Failed to establish tunnel:', err.message);
  console.log('\nAlternative fallback command:');
  console.log('ssh -p 443 -R0:localhost:5000 a.pinggy.io');
}
