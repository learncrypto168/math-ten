import React from 'react';
import { motion, Transition } from 'framer-motion';
import { Star, Heart, Zap, Circle, X } from 'lucide-react';

type LayoutIdResolver = (index: number, type: 'primary' | 'secondary') => string | undefined;
type TransitionResolver = (type: 'primary' | 'secondary', globalIndex: number) => Transition;

interface TenFrameRowProps {
  rowNumber: number;
  filledCount: number; // Primary filled (Color 1)
  secondaryFilledCount?: number; // Secondary filled (Color 2)
  removedCount?: number; // Count of items to mark as removed (from the end of filledCount)
  color: string;
  secondaryColor?: string;
  iconType: 'star' | 'heart' | 'zap' | 'circle';
  isResult: boolean;
  startIndex: number; // The global index of the first item in this row
  layoutIdResolver?: LayoutIdResolver;
  motionTransition?: Transition | TransitionResolver;
  primaryEmoji?: string;
  secondaryEmoji?: string;
}

// Wrapper component to handle the interaction (drag/hover) without the constant floating loop
const FloatingDot = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2} // Feel like a toy on a string
      whileDrag={{ scale: 1.3, zIndex: 50 }}
      whileHover={{ scale: 1.1 }}
      style={{ cursor: 'grab', touchAction: 'none' }}
      onPointerDown={(e) => {
        // Prevent default touch actions to allow dragging on mobile
        e.stopPropagation();
      }}
    >
      {children}
    </motion.div>
  );
};

const getIcon = (iconType: string, itemColor: string, emoji?: string) => {
  if (emoji) {
    return <span className="text-lg md:text-2xl leading-none select-none pointer-events-none filter drop-shadow-sm">{emoji}</span>;
  }

  const props = { className: `w-4 h-4 md:w-6 md:h-6 ${itemColor} fill-current select-none pointer-events-none` };
  switch (iconType) {
    case 'star': return <Star {...props} />;
    case 'heart': return <Heart {...props} />;
    case 'zap': return <Zap {...props} />;
    default: return <Circle {...props} />;
  }
};

const TenFrameRow: React.FC<TenFrameRowProps> = ({ 
  rowNumber, 
  filledCount, 
  secondaryFilledCount = 0,
  removedCount = 0,
  color, 
  secondaryColor,
  iconType,
  isResult,
  startIndex,
  layoutIdResolver,
  motionTransition,
  primaryEmoji,
  secondaryEmoji
}) => {
  
  return (
    <div className="flex items-center gap-2 md:gap-3">
      {/* Row Number - Simplified Styling */}
      <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center text-gray-400 font-bold text-xs md:text-sm select-none opacity-60">
        {rowNumber}
      </div>

      {/* Grid Container */}
      <div className="flex items-center gap-3 md:gap-6">
        {/* Groups */}
        {[0, 5].map(groupStart => (
          <div key={groupStart} className="flex gap-1 md:gap-2">
            {Array.from({ length: 5 }).map((_, i) => {
              const indexInRow = groupStart + i;
              const globalIndex = startIndex + indexInRow;
              
              const isPrimary = indexInRow < filledCount;
              const isSecondary = !isPrimary && indexInRow < (filledCount + secondaryFilledCount);
              const isFilled = isPrimary || isSecondary;
              const activeColor = isPrimary ? color : (secondaryColor || color);
              const activeEmoji = isPrimary ? primaryEmoji : (secondaryEmoji || primaryEmoji);

              // Calculate unique ID
              let lid = undefined;
              if (isFilled && layoutIdResolver) {
                 lid = layoutIdResolver(globalIndex, isPrimary ? 'primary' : 'secondary');
              }

              // Subtraction Logic: Mark as removed if it's in the primary set and within the removal range
              // We remove from the end of the filled set.
              // Logic: if we have 5 items and remove 2, indices 3 and 4 are removed.
              // indexInRow >= (filledCount - removedCount)
              const isRemoved = isPrimary && indexInRow >= (filledCount - removedCount);

              // Resolve Transition
              const transitionConfig = typeof motionTransition === 'function' 
                ? motionTransition(isPrimary ? 'primary' : 'secondary', globalIndex)
                : (motionTransition || { 
                    type: 'spring', 
                    stiffness: 300, 
                    damping: 20,
                    layout: { duration: 0.8 }
                  });

              return (
                <div 
                  key={i} 
                  className={`
                    w-8 h-8 md:w-12 md:h-12 rounded-lg border-2 border-gray-300 flex items-center justify-center
                    ${isResult ? 'bg-white' : 'bg-white/50'}
                    transition-colors duration-300 bg-gray-50
                    relative
                  `}
                >
                  <motion.div
                    layoutId={lid}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: isFilled ? 1 : 0, 
                      opacity: isFilled ? (isRemoved ? 0.4 : 1) : 0
                    }}
                    transition={transitionConfig}
                  >
                    {isFilled && (
                      <FloatingDot>
                        {getIcon(iconType, activeColor, activeEmoji)}
                      </FloatingDot>
                    )}
                  </motion.div>
                  
                  {/* Removed Overlay */}
                  {isFilled && isRemoved && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <X className="w-8 h-8 text-red-500 opacity-80" strokeWidth={3} />
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

interface TenFrameGridProps {
  value: number; // Primary Value
  secondaryValue?: number; // Secondary Value (appended after primary)
  removedValue?: number; // Amount to remove from primary value
  maxValue?: number;
  color?: string; // Primary Color
  secondaryColor?: string; // Secondary Color
  iconType?: 'star' | 'heart' | 'zap' | 'circle';
  isResult?: boolean;
  layoutIdResolver?: LayoutIdResolver;
  motionTransition?: Transition | TransitionResolver;
  primaryEmoji?: string;
  secondaryEmoji?: string;
}

const TenFrameGrid: React.FC<TenFrameGridProps> = ({ 
  value, 
  secondaryValue = 0,
  removedValue = 0,
  maxValue = 10, 
  color = 'text-sparkle-primary', 
  secondaryColor = 'text-sparkle-secondary',
  iconType = 'circle',
  isResult = false,
  layoutIdResolver,
  motionTransition,
  primaryEmoji,
  secondaryEmoji
}) => {
  const totalValue = value + secondaryValue;
  const effectiveMax = Math.max(totalValue, maxValue, 10);
  const rowCount = Math.ceil(effectiveMax / 10);
  
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Container Wrapper for Grid */}
      <div className="flex flex-col gap-2 p-3 bg-white/40 rounded-3xl border border-white/60 shadow-sm">
        {Array.from({ length: rowCount }).map((_, i) => {
          const rowStart = i * 10;
          const rowEnd = (i + 1) * 10;
          const pStart = 0;
          const pEnd = value;
          const sStart = value;
          const sEnd = value + secondaryValue;

          // Calculate overlap for Primary in this row
          const rowPrimaryCount = Math.max(0, Math.min(pEnd, rowEnd) - Math.max(pStart, rowStart));

          // Calculate overlap for Secondary in this row
          const rowSecondaryCount = Math.max(0, Math.min(sEnd, rowEnd) - Math.max(sStart, rowStart));
          
          // Calculate removed count for this row
          // Removed range is [value - removedValue, value)
          const rStart = Math.max(0, value - removedValue);
          const rEnd = value;
          const rowRemovedCount = Math.max(0, Math.min(rEnd, rowEnd) - Math.max(rStart, rowStart));

          return (
            <TenFrameRow 
              key={i}
              startIndex={rowStart}
              rowNumber={i + 1}
              filledCount={rowPrimaryCount}
              secondaryFilledCount={rowSecondaryCount}
              removedCount={rowRemovedCount}
              color={color}
              secondaryColor={secondaryColor}
              iconType={iconType}
              isResult={isResult}
              layoutIdResolver={layoutIdResolver}
              motionTransition={motionTransition}
              primaryEmoji={primaryEmoji}
              secondaryEmoji={secondaryEmoji}
            />
          );
        })}
      </div>
      {/* Summary Number Tab */}
      <div className={`-mt-2 text-xl font-bold font-sans ${color} bg-white/60 backdrop-blur-sm border-x border-b border-white/70 rounded-b-xl px-4 py-1 shadow-md`}>
          {isResult && removedValue > 0 ? value - removedValue : totalValue}
      </div>
    </div>
  );
};

interface DivisionGridProps {
  total: number;
  groupCount: number;
  color: string;
  iconType?: 'star' | 'heart' | 'zap' | 'circle';
  layoutIdResolver?: LayoutIdResolver;
  emoji?: string;
}

export const DivisionGrid: React.FC<DivisionGridProps> = ({
  total,
  groupCount,
  color,
  iconType = 'circle',
  layoutIdResolver,
  emoji
}) => {
  const itemsPerGroup = Math.floor(total / groupCount);

  // Helper to render dots in a ten-frame structure (5-5 split)
  const renderGroupContent = (count: number, groupIndex: number) => {
    // If count is 0, render nothing
    if (count === 0) return null;

    const rowCount = Math.ceil(count / 10);

    return (
      <div className="flex flex-col gap-1">
        {Array.from({ length: rowCount }).map((_, rowIndex) => {
          // Check if this specific row needs a split (has more than 5 items)
          const itemsInThisRow = Math.min(10, Math.max(0, count - rowIndex * 10));
          const hasSplit = itemsInThisRow > 5;
          
          return (
            <div 
              key={rowIndex} 
              className={`flex items-center ${hasSplit ? 'gap-2 md:gap-4' : ''}`}
            >
             {[0, 5].map(chunkOffset => {
               // Only render the second chunk if we have enough items (split is needed)
               if (chunkOffset === 5 && !hasSplit) return null;

               return (
                 <div key={chunkOffset} className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                       const itemIndexInGroup = rowIndex * 10 + chunkOffset + i;
                       if (itemIndexInGroup >= count) return null;

                       const globalIndex = groupIndex * itemsPerGroup + itemIndexInGroup;
                       let lid = undefined;
                       if (layoutIdResolver) {
                          lid = layoutIdResolver(globalIndex, 'primary');
                       }

                       return (
                          <div 
                            key={i} 
                            className="w-6 h-6 md:w-8 md:h-8 rounded-md border border-gray-300 flex items-center justify-center bg-white/80"
                          >
                             <motion.div
                               layoutId={lid}
                               initial={{ opacity: 0, scale: 0 }}
                               animate={{ opacity: 1, scale: 1 }}
                               transition={{
                                 type: 'spring',
                                 stiffness: 400,
                                 damping: 25,
                                 layout: { duration: 0.8 }
                               }}
                             >
                                <FloatingDot>
                                  {getIcon(iconType, color, emoji)}
                                </FloatingDot>
                             </motion.div>
                          </div>
                       );
                    })}
                 </div>
               );
             })}
          </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-wrap justify-center gap-4 md:gap-8 items-start">
       {Array.from({ length: groupCount }).map((_, groupIndex) => (
         <motion.div 
            key={groupIndex}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 * groupIndex }}
            className="flex flex-col items-center"
         >
            {/* Container Box */}
            <div className="border-2 border-dashed border-sparkle-primary/50 bg-white/40 rounded-2xl p-3 min-w-[80px] min-h-[80px] flex justify-center shadow-inner">
               {renderGroupContent(itemsPerGroup, groupIndex)}
            </div>
            {/* Group Label */}
            <div className="mt-2 text-sparkle-primary font-bold text-sm bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
               {groupIndex + 1}
            </div>
         </motion.div>
       ))}
    </div>
  );
};

interface MultiplicationGridProps {
  itemsPerGroup: number;
  groupCount: number;
  color: string;
  iconType?: 'star' | 'heart' | 'zap' | 'circle';
  layoutIdResolver?: LayoutIdResolver;
  emoji?: string;
}

export const MultiplicationGrid: React.FC<MultiplicationGridProps> = ({
  itemsPerGroup,
  groupCount,
  color,
  iconType = 'circle',
  layoutIdResolver,
  emoji
}) => {
  // Reuse DivisionGrid logic/structure but conceptualized as building up groups
  // We can actually just use DivisionGrid implementation since it renders "groupCount" groups of size "total/groupCount"
  // Here we have itemsPerGroup and groupCount. Total = itemsPerGroup * groupCount.
  
  return (
    <DivisionGrid 
      total={itemsPerGroup * groupCount} 
      groupCount={groupCount}
      color={color}
      iconType={iconType}
      layoutIdResolver={layoutIdResolver}
      emoji={emoji}
    />
  );
}

export default TenFrameGrid;