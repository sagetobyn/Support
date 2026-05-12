import { defaultCalculatorInputs, type CalculatorInputs } from "@/lib/calculator";

export const lowLeakageCalculatorFixture: CalculatorInputs = {
  ...defaultCalculatorInputs,
  monthlyOrders: 80,
  codPercentage: 12,
  overallRtoPercentage: 5,
  codRtoPercentage: 6,
  category: "Home Decor",
  targetRtoReductionPercentage: 20
};

export const highLeakageCalculatorFixture: CalculatorInputs = {
  ...defaultCalculatorInputs,
  monthlyOrders: 2000,
  codPercentage: 72,
  overallRtoPercentage: 24,
  codRtoPercentage: 31,
  category: "Fashion",
  targetRtoReductionPercentage: 20
};

export const validPilotOwnerFixture = {
  ownerRole: "Ops lead",
  ownerName: "Pilot owner",
  morningWindow: "10:00-11:00",
  afternoonWindow: "15:00-16:00",
  eveningWindow: "18:00-19:00",
  escalationChannel: "Founder escalation group"
};
