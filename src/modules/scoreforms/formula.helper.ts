import { BadRequestException } from "@nestjs/common";

export class FormulaHelper {
    // Extract col[uuid] references from formula
    static extractColumnReferences(formula: string): string[] {
        if (!formula) return []
        const regex = /col\[([a-f0-9-]{36})\]/gi
        const matches = formula.matchAll(regex)
        return Array.from(matches, m => m[1])
    }

    // Build dependency graph from columns
    static buildDependencyGraph(columns: { id: string, formula_content: string | null }[]): Map<string, string[]> {
        const graph = new Map<string, string[]>()
        
        for (const col of columns) {
            const refs = this.extractColumnReferences(col.formula_content || '')
            graph.set(col.id, refs)
        }
        
        return graph
    }

    // Detect circular dependency using DFS
    static detectCircularDependency(
        columnId: string,
        formula: string,
        existingColumns: { id: string, formula_content: string | null, label: string }[]
    ): void {
        const newRefs = this.extractColumnReferences(formula)
        
        // Build graph with new column
        const graph = this.buildDependencyGraph(existingColumns)
        graph.set(columnId, newRefs)
        
        // DFS to detect cycle
        const visited = new Set<string>()
        const recStack = new Set<string>()
        
        const dfs = (nodeId: string, path: string[]): string[] | null => {
            if (recStack.has(nodeId)) {
                // Found cycle
                const cycleStart = path.indexOf(nodeId)
                return path.slice(cycleStart).concat(nodeId)
            }
            
            if (visited.has(nodeId)) return null
            
            visited.add(nodeId)
            recStack.add(nodeId)
            path.push(nodeId)
            
            const neighbors = graph.get(nodeId) || []
            for (const neighbor of neighbors) {
                const cycle = dfs(neighbor, [...path])
                if (cycle) return cycle
            }
            
            recStack.delete(nodeId)
            return null
        }
        
        const cycle = dfs(columnId, [])
        
        if (cycle) {
            const cycleLabels = cycle.map(id => {
                const col = existingColumns.find(c => c.id === id)
                return col ? col.label : id
            })
            throw new BadRequestException(
                `Công thức tạo vòng lặp tham chiếu: ${cycleLabels.join(' → ')}`
            )
        }
    }

    // Safe eval formula (whitelist approach)
    static safeEval(formula: string): number {
        // Remove all col[uuid] - should be replaced before calling this
        if (formula.includes('col[')) {
            throw new BadRequestException("Formula contains unreplaced column references")
        }
        
        // Whitelist: only numbers, operators, parentheses, spaces
        const sanitized = formula.replace(/[^0-9+\-*/().\s]/g, '')
        
        if (sanitized !== formula) {
            throw new BadRequestException("Formula contains invalid characters")
        }
        
        try {
            // Use Function constructor (safer than eval)
            const result = new Function(`return ${sanitized}`)()
            return parseFloat(result) || 0
        } catch (error) {
            throw new BadRequestException("Invalid formula syntax")
        }
    }

    // Replace col[uuid] with actual values
    static replaceReferences(
        formula: string,
        cellValues: Map<string, number>
    ): string {
        let result = formula
        
        for (const [colId, value] of cellValues.entries()) {
            const regex = new RegExp(`col\\[${colId}\\]`, 'gi')
            result = result.replace(regex, (value ?? 0).toString())
        }
        
        return result
    }

    // Check if column is referenced in other formulas
    static isColumnReferenced(
        columnId: string,
        columns: { id: string, formula_content: string | null, label: string }[]
    ): { isReferenced: boolean, referencedBy: string[] } {
        const referencedBy: string[] = []
        
        for (const col of columns) {
            if (col.id === columnId) continue
            
            const refs = this.extractColumnReferences(col.formula_content || '')
            if (refs.includes(columnId)) {
                referencedBy.push(col.label)
            }
        }
        
        return {
            isReferenced: referencedBy.length > 0,
            referencedBy
        }
    }
}
