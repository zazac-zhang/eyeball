export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 10]} intensity={0.8} />
      <directionalLight position={[-5, -5, 5]} intensity={0.3} />
      <spotLight position={[0, 0, 30]} angle={0.3} penumbra={0.5} intensity={0.5} />
      <pointLight position={[5, 5, 15]} intensity={0.3} color="#8888ff" />
    </>
  );
}
