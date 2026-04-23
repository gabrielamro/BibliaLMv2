import React, { useRef, useEffect } from 'react';
import { Text, Transformer } from 'react-konva';

export const TextNode = ({
    text,
    x,
    y,
    width,
    fontSize,
    color,
    isSelected,
    onSelect,
    onChange
}: any) => {
    const textRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    useEffect(() => {
        if (isSelected) {
            trRef.current.nodes([textRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    return (
        <>
            <Text
                ref={textRef}
                text={text}
                x={x}
                y={y}
                width={width}
                fontSize={fontSize}
                fill={color || "#fff"}
                draggable
                align="center"
                onClick={onSelect}
                onTap={onSelect}

                onDragMove={(e) => {
                    const stage = e.target.getStage();
                    if (!stage) return;
                    const centerX = stage.width() / 2;

                    // SNAP NO CENTRO
                    if (Math.abs(e.target.x() - centerX + width / 2) < 10) {
                        e.target.x(centerX - width / 2);
                    }
                }}

                onDragEnd={(e) => {
                    onChange({
                        x: e.target.x(),
                        y: e.target.y()
                    });
                }}

                onTransformEnd={() => {
                    const node = textRef.current;
                    const scaleX = node.scaleX();

                    node.scaleX(1);
                    node.scaleY(1);

                    onChange({
                        x: node.x(),
                        y: node.y(),
                        width: Math.max(100, node.width() * scaleX),
                        fontSize: Math.max(12, node.fontSize() * scaleX)
                    });
                }}
            />

            {isSelected && (
                <Transformer
                    ref={trRef}
                    enabledAnchors={[
                        'middle-left',
                        'middle-right'
                    ]}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 100) return oldBox;
                        return newBox;
                    }}
                />
            )}
        </>
    );
};