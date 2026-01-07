import { PrismaClient } from './prisma/generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function checkDatabase() {
  try {
    console.log('Checking database connection...');
    
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    
    console.log(`Users in database: ${userCount}`);
    console.log(`Posts in database: ${postCount}`);
    
    if (postCount > 0) {
      const posts = await prisma.post.findMany({
        take: 3,
        include: {
          author: {
            select: { name: true, email: true }
          }
        }
      });
      
      console.log('\nSample posts:');
      posts.forEach(post => {
        console.log(`- ${post.title} by ${post.author?.name || 'Unknown'}`);
      });
    }
    
  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();