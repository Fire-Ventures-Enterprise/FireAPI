#!/usr/bin/env python3
"""
Template validation script for trade library
Validates JSON structure and calculates sample estimates
"""

import json
import sys
from pathlib import Path

def load_template(template_path):
    """Load and parse template JSON"""
    try:
        with open(template_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading template: {e}")
        return None

def validate_template_structure(template):
    """Validate required template fields"""
    required_fields = [
        'job_id', 'trade_category', 'job_name', 'description',
        'phases', 'labor_rates', 'sizing_factors'
    ]
    
    missing_fields = []
    for field in required_fields:
        if field not in template:
            missing_fields.append(field)
    
    if missing_fields:
        print(f"❌ Missing required fields: {missing_fields}")
        return False
    
    print("✅ All required template fields present")
    return True

def validate_phases(phases):
    """Validate phase structure"""
    if not phases or not isinstance(phases, list):
        print("❌ Phases must be a non-empty list")
        return False
    
    total_tasks = 0
    total_materials = 0
    
    for i, phase in enumerate(phases, 1):
        required_phase_fields = ['phase_id', 'phase_name', 'sequence', 'tasks', 'materials']
        missing = [field for field in required_phase_fields if field not in phase]
        
        if missing:
            print(f"❌ Phase {i} missing fields: {missing}")
            return False
        
        total_tasks += len(phase.get('tasks', []))
        total_materials += len(phase.get('materials', []))
    
    print(f"✅ {len(phases)} phases validated")
    print(f"  📋 Total tasks: {total_tasks}")
    print(f"  📦 Total material categories: {total_materials}")
    return True

def calculate_sample_estimate(template, kitchen_size="medium", scope="standard"):
    """Calculate a sample estimate using template data"""
    
    # Get sizing factors
    size_factor = template['sizing_factors']['kitchen_size'].get(kitchen_size, {})
    scope_factor = template['sizing_factors']['renovation_scope'].get(scope, {})
    
    if not size_factor or not scope_factor:
        print(f"❌ Invalid kitchen size '{kitchen_size}' or scope '{scope}'")
        return None
    
    # Determine which phases to include
    phases_to_include = scope_factor.get('phases_included', 'all')
    if phases_to_include == 'all':
        included_phases = template['phases']
    else:
        included_phases = [p for p in template['phases'] if p['phase_id'] in phases_to_include]
    
    # Calculate totals
    total_labor_hours = 0
    total_material_cost = 0
    labor_rates = template['labor_rates']
    
    print(f"\n🧮 Sample Estimate: {kitchen_size.title()} Kitchen, {scope.title()} Renovation")
    print("=" * 60)
    
    for phase in included_phases:
        phase_labor_hours = 0
        phase_material_cost = 0
        
        # Sum labor hours for phase
        for task in phase.get('tasks', []):
            hours = task.get('labor_hours', 0)
            phase_labor_hours += hours
        
        # Sum material costs for phase  
        for material in phase.get('materials', []):
            quantity = material.get('quantity', 0)
            unit_cost = material.get('unit_cost_base', 0)
            waste_factor = material.get('waste_factor', 0)
            
            material_cost = quantity * unit_cost * (1 + waste_factor)
            phase_material_cost += material_cost
        
        total_labor_hours += phase_labor_hours
        total_material_cost += phase_material_cost
        
        print(f"Phase {phase['sequence']}: {phase['phase_name']}")
        print(f"  Labor: {phase_labor_hours:>3.0f} hours")
        print(f"  Materials: ${phase_material_cost:>8,.0f}")
    
    # Apply complexity multipliers
    complexity_multiplier = size_factor.get('complexity_multiplier', 1.0) * scope_factor.get('complexity_multiplier', 1.0)
    
    adjusted_labor_hours = total_labor_hours * complexity_multiplier
    adjusted_material_cost = total_material_cost * complexity_multiplier
    
    # Calculate labor costs using typical rates
    typical_rate = labor_rates['skilled']['typical']
    total_labor_cost = adjusted_labor_hours * typical_rate
    
    print("\n" + "-" * 60)
    print(f"Subtotal Labor Hours: {total_labor_hours:>8.0f}")
    print(f"Complexity Multiplier: {complexity_multiplier:>8.1f}x")
    print(f"Adjusted Labor Hours: {adjusted_labor_hours:>8.0f}")
    print(f"Labor Cost (@${typical_rate}/hr): ${total_labor_cost:>8,.0f}")
    print(f"Material Cost: ${adjusted_material_cost:>8,.0f}")
    print("=" * 60)
    print(f"TOTAL ESTIMATE: ${total_labor_cost + adjusted_material_cost:>8,.0f}")
    print("=" * 60)
    
    return {
        'labor_hours': adjusted_labor_hours,
        'labor_cost': total_labor_cost,
        'material_cost': adjusted_material_cost,
        'total_cost': total_labor_cost + adjusted_material_cost
    }

def main():
    template_path = Path(__file__).parent / 'trade_library' / 'multi_trade' / 'kitchen_renovation_complete.json'
    
    print("🔍 Validating Kitchen Renovation Template")
    print("=" * 50)
    
    # Load template
    template = load_template(template_path)
    if not template:
        sys.exit(1)
    
    # Validate structure
    if not validate_template_structure(template):
        sys.exit(1)
    
    # Validate phases
    if not validate_phases(template['phases']):
        sys.exit(1)
    
    # Calculate sample estimates
    print("\n📊 Sample Estimates")
    print("=" * 50)
    
    scenarios = [
        ('small', 'cosmetic'),
        ('medium', 'standard'), 
        ('large', 'gut_renovation')
    ]
    
    for size, scope in scenarios:
        estimate = calculate_sample_estimate(template, size, scope)
        if estimate:
            print()
    
    print("\n✅ Template validation completed successfully!")
    print("\n💡 Template Summary:")
    print(f"  📁 Job ID: {template['job_id']}")
    print(f"  🏷️  Category: {template['trade_category']}")  
    print(f"  📋 Phases: {len(template['phases'])}")
    print(f"  ⚠️  Complications: {len(template.get('common_complications', []))}")
    print(f"  🎯 Quality Tiers: {len(template.get('quality_tiers', {}))}")

if __name__ == "__main__":
    main()