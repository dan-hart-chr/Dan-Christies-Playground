import { ErrorBoundary } from "@/components/error-boundary";
import EntranceAnimation from "@/components/entrance-animation";
import ScrollTypography from "@/components/scroll-typography";
import Grid3DSection from "@/components/grid-3d-section";
import EdSullivanSection from "@/components/ed-sullivan-section";
import DylanTitleSection from "@/components/dylan-title-section";
import CarnegieHallSection from "@/components/carnegie-hall-section";
import RKOTheatreSection from "@/components/rko-theatre-section";
import MannysMusicSection from "@/components/mannys-music-section";
import MadisonSquareGardenSection from "@/components/madison-square-garden-section";
import ChristiesSection from "@/components/christies-section";
import CTASection from "@/components/cta-section";
import Navbar from "@/components/navbar";
import SmoothScrollProvider from "@/components/smooth-scroll-provider";

interface HomePageProps {
  onLogout: () => void;
}

export default function HomePage({ onLogout }: HomePageProps) {
  return (
    <SmoothScrollProvider>
      <Navbar onLogout={onLogout} />

      <ErrorBoundary>
        <EntranceAnimation />
      </ErrorBoundary>

      <ErrorBoundary>
        <ScrollTypography />
      </ErrorBoundary>

      <ErrorBoundary>
        <Grid3DSection />
      </ErrorBoundary>

      <ErrorBoundary>
        <EdSullivanSection />
      </ErrorBoundary>

      <ErrorBoundary>
        <DylanTitleSection />
      </ErrorBoundary>

      <ErrorBoundary>
        <CarnegieHallSection />
      </ErrorBoundary>

      <ErrorBoundary>
        <RKOTheatreSection />
      </ErrorBoundary>

      <ErrorBoundary>
        <MannysMusicSection />
      </ErrorBoundary>

      <ErrorBoundary>
        <MadisonSquareGardenSection />
      </ErrorBoundary>

      <ErrorBoundary>
        <ChristiesSection />
      </ErrorBoundary>

      <ErrorBoundary>
        <CTASection />
      </ErrorBoundary>
    </SmoothScrollProvider>
  );
}
