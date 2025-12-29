import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// =============================================================================
// CONFIGURATION
// =============================================================================
const GRID_SIZE = 32; // 32x32 = 1024 squares
const TILE_SIZE = 1;
const TILE_GAP = 0.02;

// =============================================================================
// INSTANCED GRID FLOOR
// Uses GPU instancing: 1000+ tiles rendered in a single draw call
// =============================================================================
function GridFloor({ size, hoveredTile, onTileHover, onTileClick }) {
  const meshRef = useRef();
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  
  // Pre-calculate all tile positions
  const tileCount = size * size;
  const tileData = useMemo(() => {
    const data = [];
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const isLight = (x + z) % 2 === 0;
        data.push({
          id: `tile-${x}-${z}`,
          x: x - size / 2,
          z: z - size / 2,
          baseColor: isLight ? '#3d5a80' : '#293241'
        });
      }
    }
    return data;
  }, [size]);

  // Set up instanced mesh on mount and when hover changes
  React.useEffect(() => {
    if (!meshRef.current) return;
    
    tileData.forEach((tile, i) => {
      // Position
      tempMatrix.setPosition(
        tile.x * (TILE_SIZE + TILE_GAP),
        0,
        tile.z * (TILE_SIZE + TILE_GAP)
      );
      meshRef.current.setMatrixAt(i, tempMatrix);
      
      // Color (highlight if hovered)
      const isHovered = hoveredTile === tile.id;
      tempColor.set(isHovered ? '#98c1d9' : tile.baseColor);
      meshRef.current.setColorAt(i, tempColor);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [tileData, hoveredTile, tempMatrix, tempColor]);

  // Raycasting for hover/click on instanced mesh
  const handlePointerMove = useCallback((e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) {
      onTileHover(tileData[e.instanceId].id);
    }
  }, [tileData, onTileHover]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) {
      onTileClick(tileData[e.instanceId]);
    }
  }, [tileData, onTileClick]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, tileCount]}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      onPointerLeave={() => onTileHover(null)}
    >
      <boxGeometry args={[TILE_SIZE, 0.1, TILE_SIZE]} />
      <meshStandardMaterial vertexColors />
    </instancedMesh>
  );
}

// =============================================================================
// INTERACTIVE BLOCK
// Individual 3D blocks that can be hovered and clicked
// =============================================================================
function Block({ id, position, color, isHovered, isSelected, onHover, onClick }) {
  const meshRef = useRef();
  const [scale, setScale] = useState(1);
  
  // Smooth hover animation
  useFrame((state, delta) => {
    const targetScale = isHovered ? 1.1 : 1;
    setScale(prev => THREE.MathUtils.lerp(prev, targetScale, delta * 10));
  });

  const finalColor = isSelected ? '#ffd700' : isHovered ? '#ff6b6b' : color;

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={[scale, scale, scale]}
      onPointerOver={(e) => { e.stopPropagation(); onHover(id); }}
      onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}
      onClick={(e) => { e.stopPropagation(); onClick(id); }}
    >
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial color={finalColor} />
      {/* Outline when selected */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(0.82, 0.82, 0.82)]} />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
      )}
    </mesh>
  );
}

// =============================================================================
// FLOATING BLOCK (animated demo)
// =============================================================================
function FloatingBlock({ id, basePosition, color, isHovered, isSelected, onHover, onClick }) {
  const meshRef = useRef();
  const [hoverScale, setHoverScale] = useState(1);
  
  useFrame((state) => {
    // Bobbing animation
    const y = basePosition[1] + Math.sin(state.clock.elapsedTime * 2 + basePosition[0]) * 0.1;
    meshRef.current.position.y = y;
    
    // Hover scale
    const targetScale = isHovered ? 1.15 : 1;
    setHoverScale(prev => THREE.MathUtils.lerp(prev, targetScale, 0.1));
  });

  const finalColor = isSelected ? '#ffd700' : isHovered ? '#ff6b6b' : color;

  return (
    <mesh
      ref={meshRef}
      position={basePosition}
      scale={[hoverScale, hoverScale, hoverScale]}
      onPointerOver={(e) => { e.stopPropagation(); onHover(id); }}
      onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}
      onClick={(e) => { e.stopPropagation(); onClick(id); }}
      castShadow
    >
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial color={finalColor} metalness={0.3} roughness={0.4} />
    </mesh>
  );
}

// =============================================================================
// SCENE SETUP
// =============================================================================
function Scene({ blocks, hoveredBlock, selectedBlock, onBlockHover, onBlockClick }) {
  const [hoveredTile, setHoveredTile] = useState(null);

  const handleTileClick = useCallback((tile) => {
    console.log('Tile clicked:', tile);
  }, []);

  return (
    <>
      {/* Isometric Camera - the KEY to the isometric look! */}
      <OrthographicCamera
        makeDefault
        zoom={40}
        position={[20, 20, 20]}
        near={0.1}
        far={1000}
      />
      
      {/* Controls - allows rotation but maintains isometric feel */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minZoom={20}
        maxZoom={100}
        target={[0, 0, 0]}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-10, 10, -10]} intensity={0.3} />
      
      {/* The Grid Floor */}
      <GridFloor
        size={GRID_SIZE}
        hoveredTile={hoveredTile}
        onTileHover={setHoveredTile}
        onTileClick={handleTileClick}
      />
      
      {/* Interactive Blocks */}
      {blocks.map((block) => (
        <FloatingBlock
          key={block.id}
          id={block.id}
          basePosition={block.position}
          color={block.color}
          isHovered={hoveredBlock === block.id}
          isSelected={selectedBlock === block.id}
          onHover={onBlockHover}
          onClick={onBlockClick}
        />
      ))}
    </>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function IsometricWorld() {
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  
  // Sample blocks placed on the grid
  const blocks = useMemo(() => {
    const colors = ['#e63946', '#2a9d8f', '#e9c46a', '#264653', '#f4a261', '#a855f7', '#06b6d4'];
    const generated = [];
    
    // Create a cluster of blocks
    for (let i = 0; i < 25; i++) {
      const x = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 20;
      generated.push({
        id: `block-${i}`,
        position: [x, 0.5, z],
        color: colors[i % colors.length]
      });
    }
    
    // Add a few stacked blocks
    generated.push({ id: 'stack-1', position: [5, 0.5, 5], color: '#e63946' });
    generated.push({ id: 'stack-2', position: [5, 1.4, 5], color: '#2a9d8f' });
    generated.push({ id: 'stack-3', position: [5, 2.3, 5], color: '#e9c46a' });
    
    return generated;
  }, []);

  const handleBlockClick = useCallback((id) => {
    setSelectedBlock(prev => prev === id ? null : id);
  }, []);

  return (
    <div className="w-full h-screen bg-gray-900 relative">
      {/* Info Panel */}
      <div className="absolute top-4 left-4 z-10 bg-gray-800/90 backdrop-blur p-4 rounded-lg text-white max-w-xs">
        <h2 className="text-xl font-bold mb-2">Isometric World</h2>
        <p className="text-sm text-gray-300 mb-3">
          {GRID_SIZE}×{GRID_SIZE} = {GRID_SIZE * GRID_SIZE} tiles
        </p>
        <div className="text-xs text-gray-400 space-y-1">
          <p>🖱️ <span className="text-gray-300">Drag</span> to rotate</p>
          <p>🔍 <span className="text-gray-300">Scroll</span> to zoom</p>
          <p>👆 <span className="text-gray-300">Click</span> blocks to select</p>
        </div>
        
        {/* State display */}
        <div className="mt-4 pt-3 border-t border-gray-700">
          <p className="text-xs">
            <span className="text-gray-400">Hovered:</span>{' '}
            <span className="text-cyan-400">{hoveredBlock || 'none'}</span>
          </p>
          <p className="text-xs">
            <span className="text-gray-400">Selected:</span>{' '}
            <span className="text-yellow-400">{selectedBlock || 'none'}</span>
          </p>
        </div>
      </div>
      
      {/* Three.js Canvas */}
      <Canvas shadows>
        <Scene
          blocks={blocks}
          hoveredBlock={hoveredBlock}
          selectedBlock={selectedBlock}
          onBlockHover={setHoveredBlock}
          onBlockClick={handleBlockClick}
        />
      </Canvas>
    </div>
  );
}
