"use client";
import React, { useRef, useEffect, useState } from 'react';

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
    const [Konva, setKonva] = useState<any>(null);

    useEffect(() => {
        // Emergency Bridge
        const r = React as any;
        if (!r.ReactSharedInternals && r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
            r.ReactSharedInternals = r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        }

        import('react-konva').then(mod => {
            setKonva(mod);
        });
    }, []);

    useEffect(() => {
        if (isSelected && trRef.current && textRef.current) {
            trRef.current.nodes([textRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected, Konva]);

    if (!Konva) return null;

    const { Text, Transformer } = Konva;

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

                onDragMove={(e: any) => {
                    const stage = e.target.getStage();
                    if (!stage) return;
                    const centerX = stage.width() / 2;

                    // SNAP NO CENTRO
                    if (Math.abs(e.target.x() - centerX + width / 2) < 10) {
                        e.target.x(centerX - width / 2);
                    }
                }}

                onDragEnd={(e: any) => {
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
                    boundBoxFunc={(oldBox: any, newBox: any) => {
                        if (newBox.width < 100) return oldBox;
                        return newBox;
                    }}
                />
            )}
        </>
    );
};