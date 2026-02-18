import { updateMemberStatuses } from './src/utils/autoUpdateStatus.js';

async function testAutoUpdate() {
  try {
    console.log('Testing updateMemberStatuses...');
    const result = await updateMemberStatuses();
    console.log('Result:', result);
  } catch (error) {
    console.error('FAILED:', error);
  } finally {
    process.exit(0);
  }
}

testAutoUpdate();
