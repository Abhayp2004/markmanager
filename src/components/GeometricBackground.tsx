export function GeometricBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated gradient orbs using pure CSS */}
      <div
        className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full opacity-20 animate-pulse"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animationDuration: '6s',
        }}
      />
      <div
        className="absolute -right-1/4 -bottom-1/4 h-[500px] w-[500px] rounded-full opacity-15 animate-pulse"
        style={{
          background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animationDuration: '8s',
          animationDelay: '2s',
        }}
      />
      <div
        className="absolute left-1/2 top-1/3 h-[300px] w-[300px] rounded-full opacity-10 animate-pulse"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animationDuration: '7s',
          animationDelay: '1s',
        }}
      />
    </div>
  );
}
