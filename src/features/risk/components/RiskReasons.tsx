export function RiskReasons({ reasons }: { reasons: string[] }) {
  return (
    <ul>
      {reasons.map((reason) => (
        <li key={reason}>{reason}</li>
      ))}
    </ul>
  );
}

