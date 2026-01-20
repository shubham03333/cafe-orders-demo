import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    DB_HOST: process.env.DB_HOST,
    DB_USERNAME: process.env.DB_USERNAME,
    DB_NAME: process.env.DB_NAME,
    hasPassword: !!process.env.DB_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
    allEnv: process.env
  });
}
