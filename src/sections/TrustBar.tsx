export default function TrustBar() {
  const items = [
    { value: '150,000+', label: 'Vehicles Listed' },
    { value: '80+', label: 'Countries Served' },
    { value: 'USS · TAA · CAA · AUCNET', label: 'Major Auction Houses' },
    { value: '15+', label: 'Years Experience' },
  ];

  return (
    <section
      style={{
        backgroundColor: 'var(--surface)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="container-main py-5">
        <div className="grid grid-cols-2 md:flex md:flex-row md:justify-center md:gap-12 gap-6">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <span
                className="text-h3"
                style={{ color: 'var(--amber)' }}
              >
                {item.value}
              </span>
              <span
                className="mt-1"
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
