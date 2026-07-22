import dotenv from 'dotenv';
dotenv.config();

import { requestOtp } from './src/modules/auth/otp.service.ts';

async function test() {
  try {
    const res = await requestOtp('support@datarsoft.tech');
    console.log('Result:', res);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
