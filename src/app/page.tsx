import GajiMarketApp from "./carrot/GajiMarketApp";
import AuthGate from "./carrot/AuthGate";

export default function Home() {
  return (
    <AuthGate>
      <GajiMarketApp />
    </AuthGate>
  );
}
