import Image from 'next/image';

export function SamsungLogo() {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <Image
        src="/images/samsung-logo.png"
        alt="Samsung"
        width={200}
        height={60}
        priority
        style={{
          maxWidth: '100%',
          height: 'auto'
        }}
      />
    </div>
  );
} 