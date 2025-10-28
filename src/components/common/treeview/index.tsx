import { useState } from 'react'

function TreeNode({ node, nodeKey, selectedNode, setSelectedNode }: any) {
  const { children, label, id } = node

  const [showChildren, setShowChildren] = useState(false)

  const handleClick = () => {
    setSelectedNode(nodeKey)
    setShowChildren(!showChildren)
  }
  return (
    <>
      <div onClick={() => handleClick()} style={{ marginBottom: '10px' }}>
        <span
          className={selectedNode === id ? 'text-primary' : 'text-secondary'}
        >
          {label}
        </span>
      </div>
      <ul style={{ paddingLeft: '10px', borderLeft: '1px solid black' }}>
        {showChildren && children && <Tree treeData={children} />}
      </ul>
    </>
  )
}
function Tree({ treeData }: any) {
  const [selectedNode, setSelectedNode] = useState('')
  return (
    <ul>
      {treeData.map((node: any) => (
        <TreeNode
          node={node}
          key={node.id}
          nodeKey={node.id}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
        />
      ))}
    </ul>
  )
}
export default Tree
