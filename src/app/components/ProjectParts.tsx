'use client';

import { useProjectStore } from '../store/useProjectStore';

export default function ProjectParts() {
  const parts = useProjectStore(state => state.project?.parts || []);
  
  return (
    <>
      {parts.map((part) => (
        <mesh
          key={part.id}
          matrix={part.matrix}
          matrixAutoUpdate={false}
          geometry={part.geometry}
          material={part.material}
        />
      ))}
    </>
  );
}