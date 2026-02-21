"use client";

import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    Node,
    Edge,
    OnNodesChange,
    OnEdgesChange,
    NodeTypes,
    Handle,
    Position,
    ConnectionMode,
    getBezierPath,
    EdgeProps,
    useInternalNode,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

// --- Utils for Floating Edges & Magnetism ---

function getEdgeParams(source: any, target: any) {
    const sourceIntersectionPoint = getNodeIntersection(source, target);
    const targetIntersectionPoint = getNodeIntersection(target, source);

    const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
    const targetPos = getEdgePosition(target, targetIntersectionPoint);

    return {
        sx: sourceIntersectionPoint.x,
        sy: sourceIntersectionPoint.y,
        tx: targetIntersectionPoint.x,
        ty: targetIntersectionPoint.y,
        sourcePos,
        targetPos,
    };
}

function getNodeIntersection(characterNode: any, targetNode: any) {
    const intersectionWidth = characterNode.measured.width ?? 150;
    const intersectionHeight = characterNode.measured.height ?? 250;
    const targetPosition = targetNode.internals.positionAbsolute;
    const characterPosition = characterNode.internals.positionAbsolute;

    const w = intersectionWidth / 2;
    const h = intersectionHeight / 2;

    const x2 = targetPosition.x + (targetNode.measured.width ?? 150) / 2;
    const y2 = targetPosition.y + (targetNode.measured.height ?? 250) / 2;
    const x1 = characterPosition.x + w;
    const y1 = characterPosition.y + h;

    const dx = x2 - x1;
    const dy = y2 - y1;

    if (Math.abs(dx / w) > Math.abs(dy / h)) {
        if (dx > 0) return { x: x1 + w, y: y1 + (h * dy) / Math.abs(dx) };
        return { x: x1 - w, y: y1 + (h * dy) / Math.abs(dx) };
    } else {
        if (dy > 0) return { x: x1 + (w * dx) / Math.abs(dy), y: y1 + h };
        return { x: x1 + (w * dx) / Math.abs(dy), y: y1 - h };
    }
}

function getEdgePosition(node: any, intersectionPoint: any) {
    const n = node.internals.positionAbsolute;
    const w = node.measured.width ?? 150;
    const h = node.measured.height ?? 250;

    if (Math.abs(intersectionPoint.x - n.x) < 1) return Position.Left;
    if (Math.abs(intersectionPoint.x - (n.x + w)) < 1) return Position.Right;
    if (Math.abs(intersectionPoint.y - n.y) < 1) return Position.Top;
    if (Math.abs(intersectionPoint.y - (h + n.y)) < 1) return Position.Bottom;

    return Position.Top;
}

const FloatingEdge = ({ id, source, target, style, markerEnd, markerStart }: EdgeProps) => {
    const sourceNode = useInternalNode(source);
    const targetNode = useInternalNode(target);

    if (!sourceNode?.measured?.width || !targetNode?.measured?.width) return null;

    const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

    const [edgePath] = getBezierPath({
        sourceX: sx,
        sourceY: sy,
        sourcePosition: sourcePos,
        targetX: tx,
        targetY: ty,
        targetPosition: targetPos,
    });

    return (
        <path
            id={id}
            className="react-flow__edge-path"
            d={edgePath}
            strokeWidth={5}
            style={style}
            markerEnd={markerEnd}
            markerStart={markerStart}
        />
    );
};

const edgeTypes = {
    floating: FloatingEdge,
};

// --- Node Component ---

const PersonNode = ({ data }: any) => {
    const genderColor = data.gender === 'MALE' ? 'border-sky-500 shadow-sky-100' :
        data.gender === 'FEMALE' ? 'border-rose-500 shadow-rose-100' :
            'border-slate-400 shadow-slate-100';

    const mainPhoto = data.photos?.[data.mainPhotoIndex] || null;

    return (
        <div className={`relative group flex flex-col items-center bg-white dark:bg-gray-800 rounded-3xl border-2 transition-all hover:scale-105 active:scale-95 ${genderColor} p-1 max-w-[150px] shadow-xl`}>
            {/* Standard Handles for drag-and-drop connections */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-4 h-4 !bg-indigo-600 border-2 border-white dark:border-gray-900 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50 cursor-crosshair hover:!scale-125"
            />
            <Handle
                type="target"
                position={Position.Top}
                className="w-4 h-4 !bg-indigo-600 border-2 border-white dark:border-gray-900 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50 cursor-crosshair hover:!scale-125"
            />

            {/* Photo Block */}
            <div className="w-[134px] h-[160px] bg-gray-100 dark:bg-gray-700 rounded-2xl overflow-hidden border-b-2 border-inherit pointer-events-none">
                {mainPhoto ? (
                    <img src={mainPhoto} alt={data.firstName} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Name Block */}
            <div className="w-full px-3 py-2 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-b-[22px] pointer-events-none">
                <div className="font-bold text-gray-900 dark:text-white leading-tight text-sm truncate">
                    {data.lastName || 'Без фамилии'}
                </div>
                <div className="text-[11px] text-gray-700 dark:text-gray-200 font-semibold truncate">
                    {data.firstName} {data.middleName || ''}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium bg-gray-50 dark:bg-gray-700/50 rounded-full px-2 py-0.5 inline-block">
                    {data.birthDate ? new Date(data.birthDate).getFullYear() : '?'} — {data.deathDate ? new Date(data.deathDate).getFullYear() : ''}
                </div>
                {/* Biography Snippet Removed as requested */}
            </div>

            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Двойной клик для просмотра
            </div>
        </div>
    );
};

const nodeTypes: NodeTypes = {
    person: PersonNode,
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodeWidth = 170;
    const nodeHeight = 250; // Adjusted height without bio

    dagreGraph.setGraph({ rankdir: direction, nodesep: 140, ranksep: 200 });

    nodes.forEach((node) => {
        // Add all nodes to graph so edges always work
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        // If it already has saved positions in DB, keep them
        if (node.data.positionX !== null && node.data.positionY !== null) return node;

        const nodeWithPosition = dagreGraph.node(node.id);
        if (!nodeWithPosition) return {
            ...node,
            position: {
                x: Math.random() * 800,
                y: Math.random() * 800
            }
        };
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: (nodeWithPosition.y - nodeHeight / 2) + (Math.random() * 20),
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

interface FamilyTreeProps {
    persons: any[];
    relationships: any[];
    onNodeDoubleClick: (personId: string) => void;
    onResetLayout: () => void; // Added for the reset layout button
}

export default function FamilyTree({ persons, relationships, onNodeDoubleClick, onResetLayout }: FamilyTreeProps) {
    const saveTimerRef = useRef<Record<string, NodeJS.Timeout>>({});

    const { nodes: iNodes, edges: iEdges } = useMemo(() => {
        const rawNodes: Node[] = persons.map((p) => ({
            id: p.id,
            type: 'person',
            data: p,
            position: { x: p.positionX || 0, y: p.positionY || 0 },
        }));

        const rawEdges: Edge[] = relationships.map((r) => {
            const isSpouse = r.relationType === 'SPOUSE';
            const isParent = r.relationType === 'PARENT'; // source (p1) is parent, target (p2) is child
            const isChild = r.relationType === 'CHILD';   // source (p1) is child, target (p2) is parent

            // markerEnd (target/person2)
            const showMarkerEnd = isSpouse || isChild;
            // markerStart (source/person1)
            const showMarkerStart = isSpouse || isParent;

            // COLOR LOGIC:
            // Arrows point from Parent -> Child. 
            // We want color based on the CHILD's gender.
            let strokeColor = '#6366f1'; // Default Indigo

            if (isParent) {
                // type 'PARENT' means P2 is parent of P1, so P1 is the child
                const child = persons.find(p => p.id === r.person1Id);
                if (child?.gender === 'FEMALE') strokeColor = '#fb7185'; // Flamingo
                else if (child?.gender === 'MALE') strokeColor = '#0ea5e9'; // Sky
            } else if (isChild) {
                // type 'CHILD' means P2 is child of P1, so P2 is the child
                const child = persons.find(p => p.id === r.person2Id);
                if (child?.gender === 'FEMALE') strokeColor = '#fb7185'; // Flamingo
                else if (child?.gender === 'MALE') strokeColor = '#0ea5e9'; // Sky
            }

            return {
                id: r.id,
                source: r.person1Id,
                target: r.person2Id,
                type: 'floating',
                style: {
                    stroke: strokeColor,
                    strokeWidth: 5,
                    strokeDasharray: isSpouse ? '8,6' : '0',
                },
                markerEnd: showMarkerEnd ? {
                    type: 'arrowclosed' as any,
                    color: strokeColor,
                    width: 7,
                    height: 7,
                } : undefined,
                markerStart: showMarkerStart ? {
                    type: 'arrowclosed' as any,
                    color: strokeColor,
                    width: 7,
                    height: 7,
                } : undefined,
            };
        });

        return getLayoutedElements(rawNodes, rawEdges);
    }, [persons, relationships]);

    const [nodes, setNodes] = React.useState<Node[]>(iNodes);
    const [edges, setEdges] = React.useState<Edge[]>(iEdges);

    const { fitView } = useReactFlow();

    useEffect(() => {
        setNodes(iNodes);
        setEdges(iEdges);
        // Center view on nodes after they are set
        setTimeout(() => fitView({ duration: 800 }), 100);
    }, [iNodes, iEdges, fitView]);

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => {
            setNodes((nds) => applyNodeChanges(changes, nds));

            changes.forEach(change => {
                if (change.type === 'position' && (change as any).position) {
                    const id = change.id;
                    const pos = (change as any).position;
                    if (saveTimerRef.current[id]) clearTimeout(saveTimerRef.current[id]);
                    saveTimerRef.current[id] = setTimeout(async () => {
                        try {
                            await fetch(`/api/persons/${id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ positionX: pos.x, positionY: pos.y })
                            });
                        } catch (err) {
                            console.error("Failed to save node position", err);
                        }
                    }, 1000);
                }
            });
        },
        []
    );

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            Object.values(saveTimerRef.current).forEach(timer => clearTimeout(timer));
        };
    }, []);

    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const onConnect = useCallback(async (params: any) => {
        try {
            const res = await fetch("/api/relationships", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    person1Id: params.source,
                    person2Id: params.target,
                    relationType: 'PARENT', // Default
                }),
            });
            if (res.ok) {
                // Success - hard redirect to home with cache bust
                window.location.assign("/?update=" + Date.now());
            } else {
                console.error("Failed to create relationship");
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    return (
        <div
            className="w-full overflow-hidden bg-transparent"
            style={{ height: 'calc(100vh - 70px)' }}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDoubleClick={(_, node) => onNodeDoubleClick(node.id)}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                connectionMode={ConnectionMode.Loose}
            >
                <Background gap={40} size={1} color="#cbd5e1" style={{ opacity: 0.3 }} />
                <Controls />
            </ReactFlow>
        </div>
    );
}
