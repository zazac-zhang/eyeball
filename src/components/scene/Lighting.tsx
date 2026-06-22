/**
 * Lighting setup for medical illustration style.
 * The studio HDRI environment map provides base illumination and reflections.
 * These lights serve as fill/adjustment on top of the environment.
 */
export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[10, 10, 10]} intensity={0.6} />
      <directionalLight position={[-5, -5, 5]} intensity={0.2} />
      <spotLight position={[0, 0, 30]} angle={0.3} penumbra={0.5} intensity={0.3} />
      <pointLight position={[5, 5, 15]} intensity={0.15} color="#8888ff" />
    </>
  );
}
