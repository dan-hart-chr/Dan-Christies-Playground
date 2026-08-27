import { ChristiesHero } from './components/sections/ChristiesHero';
import { ChristiesPhilosophy } from './components/sections/ChristiesPhilosophy';
import { ChristiesShowcase } from './components/sections/ChristiesShowcase';
import { ChristiesTestimonials } from './components/sections/ChristiesTestimonials';

export default function App() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#000' }}>
      <ChristiesHero />
      <ChristiesPhilosophy />
      <ChristiesShowcase />
      <ChristiesTestimonials />
    </main>
  );
}
