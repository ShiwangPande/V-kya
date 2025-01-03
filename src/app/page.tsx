import type { Metadata } from 'next';
import ContentGenerator from '../components/ContentGenerator';

export const metadata: Metadata = {
  title: 'Smart Content Generator',
  description: 'AI-powered content generation tool',
  keywords: ['AI', 'content generator', 'writing assistant'],
};

export default function Home() {
  return (
    <main className="min-h-screen w-full 
      transition-colors duration-200">
   
        <ContentGenerator />
  
    </main>
  );
}