/**
 * src/components/3d/TruckScene.tsx
 *
 * R3F Canvas wrapper chứa toàn bộ scene 3D:
 * - TruckContainer (wireframe thùng xe)
 * - PackedItemBox (từng kiện hàng)
 * - OrbitControls (chỉ kích hoạt khi isInteractiveMode = true)
 * - Lighting chuẩn để màu sắc hiển thị rõ
 *
 * PRD: Mặc định Static mode. User chủ động bật Interactive mode.
 */
import { Suspense, forwardRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Bounds, useBounds } from "@react-three/drei";

function AutoFitOnMount() {
  const bounds = useBounds();
  useEffect(() => {
    // Nhỏ delay để đảm bảo TruckContainer + PackedItemBox đã render xong
    const timer = setTimeout(() => bounds.refresh().fit(), 50);
    return () => clearTimeout(timer);
  }, [bounds]);
  return null;
}
import { TruckContainer } from "./TruckContainer";
import { PackedItemBox } from "./PackedItemBox";
import type { PackedItem } from "@/services/api.types";
import type { Truck } from "@/schemas";

interface TruckSceneProps {
  truck: Truck;
  packedItems: PackedItem[];
  currentStepIndex: number;
  isInteractiveMode: boolean;
}

// forwardRef để parent component (ResultLeftPanel) có thể ref DOM cho export ảnh
export const TruckScene = forwardRef<HTMLDivElement, TruckSceneProps>(
  ({ truck, packedItems, currentStepIndex, isInteractiveMode }, ref) => {
    // Scale: 1mm = 0.001 Three.js unit → xe 4500mm = 4.5 units
    const SCALE = 0.001;

    // Camera position: đứng xa nhìn từ góc phần tư
    const maxDim = Math.max(truck.length, truck.width, truck.height) * SCALE;
    const cameraZ = maxDim * 2.2;

    return (
      <div ref={ref} className="absolute inset-0 rounded-lg overflow-hidden">
        <Canvas
          camera={{ position: [cameraZ * 0.8, cameraZ * 0.6, cameraZ], fov: 45 }}
          shadows
          gl={{ preserveDrawingBuffer: true }} // Bắt buộc cho html2canvas export
        >
          {/* Ánh sáng */}
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[10, 15, 10]}
            intensity={0.8}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-5, 5, -5]} intensity={0.3} />

          {/* Lưới nền reference */}
          <Grid
            args={[20, 20]}
            position={[truck.width * SCALE / 2, 0, truck.length * SCALE / 2]}
            cellColor="#e2e2e5"
            sectionColor="#c1c6d7"
            fadeDistance={30}
            infiniteGrid
          />

          <Suspense fallback={null}>
            <Bounds fit clip observe margin={1.2}>
              <AutoFitOnMount />
              {/* Thùng xe wireframe */}
              <TruckContainer truck={truck} scale={SCALE} />

              {/* Các kiện hàng theo step_sequence */}
              {packedItems.map((item) => (
                <PackedItemBox
                  key={item.id}
                  item={item}
                  isPlaced={item.step_sequence <= currentStepIndex + 1}
                  isActive={item.step_sequence === currentStepIndex + 1}
                  scale={SCALE}
                />
              ))}
            </Bounds>
          </Suspense>

          {/* OrbitControls: chỉ enable khi user bật Interactive mode */}
          <OrbitControls
            makeDefault
            enabled={isInteractiveMode}
            enablePan={isInteractiveMode}
            enableZoom={isInteractiveMode}
            enableRotate={isInteractiveMode}
          />
        </Canvas>
      </div>
    );
  }
);

TruckScene.displayName = "TruckScene";
