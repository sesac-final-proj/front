import GajiMarketApp from "./GajiMarketApp";
import AuthGate from "./AuthGate";

export default function CarrotPrototypePage() {
  return (
    <AuthGate>
      <GajiMarketApp />
    </AuthGate>
  );
}
