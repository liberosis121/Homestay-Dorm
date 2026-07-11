import { authService } from '../services/auth.service';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    console.log('Testing auto-create profile and customer for missing user 37b39533-25cc-4cfa-988e-016207914462 (trankimyen7335@gmail.com)');
    const result = await authService.getProfile('37b39533-25cc-4cfa-988e-016207914462');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Error occurred:', error.stack || error.message);
  }
}
test();
