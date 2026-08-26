import { ChristiesHero } from './components/sections/ChristiesHero';
import { ChristiesPhilosophy } from './components/sections/ChristiesPhilosophy';
import { ChristiesTestimonials } from './components/sections/ChristiesTestimonials';

export default function App() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#000' }}>
      <ChristiesHero />
      <ChristiesPhilosophy />
      <ChristiesTestimonials />
    </main>
  );
}
