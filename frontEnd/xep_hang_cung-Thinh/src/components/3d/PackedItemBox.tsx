/**
 * src/components/3d/PackedItemBox.tsx
 *
 * Render một kiện hàng 3D tại vị trí coordinates từ API.
 * - py3dbp trả về corner position (x,y,z) → convert sang center để Three.js đặt đúng.
 * - isActive: item đang được highlight (bước hiện tại trong Playback).
 * - isPlaced: item đã được xếp (tất cả bước <= currentStep).
 */
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Mesh } from "three";
import type { PackedItem } from "@/services/api.types";

interface PackedItemBoxProps {
  item: PackedItem;
  isPlaced: boolean;
  isActive: boolean;
  /** Scale từ cm sang đơn vị Three.js (mặc định: 1cm = 0.01 unit) */
  scale?: number;
}

export function PackedItemBox({
  item,
  isPlaced,
  isActive,
  scale = 0.01,
}: PackedItemBoxProps) {
  const meshRef = useRef<Mesh>(null);

  const { x, y, z } = item.coordinates;
  const { length: l, width: w, height: h } = item.dimensions;

  // py3dbp dùng corner position → Three.js dùng center position
  // Hệ tọa độ chuẩn: X = Width, Y = Height, Z = Length
  const centerX = (x + w / 2) * scale;
  const centerY = (y + h / 2) * scale;
  const centerZ = (z + l / 2) * scale;

  // Tạo geometry 1 lần, tránh recreate mỗi frame (useMemo)
  const boxGeometry = useMemo(
    () => new THREE.BoxGeometry(w * scale, h * scale, l * scale),
    [w, h, l, scale]
  );
  const edgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(boxGeometry),
    [boxGeometry]
  );

  // Animation nhẹ khi item đang active (pulse scale)
  useFrame(({ clock }) => {
    if (!meshRef.current || !isActive) {
      if (meshRef.current) meshRef.current.scale.setScalar(1);
      return;
    }
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.015;
    meshRef.current.scale.setScalar(pulse);
  });

  if (!isPlaced) return null;

  return (
    <group position={[centerX, centerY, centerZ]}>
      {/* Khối màu kiện hàng */}
      <mesh ref={meshRef}>
        <primitive object={boxGeometry} />
        <meshStandardMaterial
          color={item.color}
          transparent
          opacity={isActive ? 1.0 : 0.82}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Edge outline — dùng EdgesGeometry + lineSegments (chuẩn ESM, không dùng require) */}
      <lineSegments>
        <primitive object={edgesGeometry} />
        <lineBasicMaterial color="#000000" transparent opacity={0.2} />
      </lineSegments>
    </group>
  );
}
