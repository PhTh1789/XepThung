/**
 * src/components/3d/TruckContainer.tsx
 *
 * Thùng xe 3D dạng wireframe (trong suốt).
 * Dùng EdgesGeometry để chỉ vẽ cạnh — nhìn thấy hàng bên trong.
 * Màu border: dùng Tailwind CSS variable thay vì hardcode hex.
 */
import { useMemo } from "react";
import * as THREE from "three";
import type { Truck } from "@/schemas";

interface TruckContainerProps {
  truck: Truck;
  /** Scale từ cm sang Three.js unit (mặc định: 0.01) */
  scale?: number;
}

export function TruckContainer({ truck, scale = 0.01 }: TruckContainerProps) {
  const { length: l, width: w, height: h } = truck;

  const scaledL = l * scale;
  const scaledW = w * scale;
  const scaledH = h * scale;

  // Center - Tọa độ tâm: bắt đầu từ góc (0,0,0) — half mỗi chiều (Hệ tọa độ: X=Width, Y=Height, Z=Length)
  const centerX = scaledW / 2;
  const centerY = scaledH / 2;
  const centerZ = scaledL / 2;

  const geometry = useMemo(
    () => new THREE.BoxGeometry(scaledW, scaledH, scaledL),
    [scaledW, scaledH, scaledL]
  );

  const edgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(geometry),
    [geometry]
  );

  return (
    <group position={[centerX, centerY, centerZ]}>
      {/* Nền thùng xe: rất transparent để nhìn xuyên qua */}
      <mesh>
        <primitive object={geometry} />
        <meshStandardMaterial
          color="#e2e2e5"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Cạnh wireframe: dùng màu border-default từ design system */}
      <lineSegments>
        <primitive object={edgesGeometry} />
        <lineBasicMaterial
          color="#c1c6d7"
          transparent
          opacity={0.7}
          linewidth={1.5}
        />
      </lineSegments>
    </group>
  );
}
