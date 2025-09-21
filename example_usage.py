#!/usr/bin/env python3
"""
Example usage of the Kitchen Renovation Template
Demonstrates how the AI would use the trade library to generate estimates
"""

import json
from pathlib import Path

class EstimateGenerator:
    """AI Estimate Generator using Trade Library Templates"""
    
    def __init__(self, template_path):
        """Initialize with template"""
        with open(template_path, 'r') as f:
            self.template = json.load(f)
    
    def parse_natural_language(self, description):
        """Parse natural language description into parameters"""
        # This would be AI-powered in real implementation
        description = description.lower()
        
        # Determine kitchen size
        if any(word in description for word in ['small', 'galley', 'tiny']):
            kitchen_size = 'small'
        elif any(word in description for word in ['large', 'big', 'spacious']):
            kitchen_size = 'large'  
        elif any(word in description for word in ['xl', 'luxury', 'massive']):
            kitchen_size = 'xl'
        else:
            kitchen_size = 'medium'
        
        # Determine renovation scope
        if any(word in description for word in ['cosmetic', 'refresh', 'update', 'paint', 'reface']):
            scope = 'cosmetic'
        elif any(word in description for word in ['gut', 'complete', 'full', 'tear down', 'rebuild']):
            scope = 'gut_renovation'
        else:
            scope = 'standard'
        
        # Determine quality tier
        if any(word in description for word in ['budget', 'cheap', 'basic', 'affordable']):
            quality = 'budget'
        elif any(word in description for word in ['luxury', 'high-end', 'premium', 'custom']):
            quality = 'luxury'
        elif any(word in description for word in ['high', 'nice', 'good quality']):
            quality = 'high_end'
        else:
            quality = 'mid_range'
        
        return {
            'kitchen_size': kitchen_size,
            'scope': scope,
            'quality_tier': quality
        }
    
    def generate_estimate(self, natural_language_input):
        """Generate detailed estimate from natural language"""
        
        # Parse the input
        params = self.parse_natural_language(natural_language_input)
        
        print(f"📝 Input: {natural_language_input}")
        print(f"🤖 Parsed Parameters:")
        print(f"   Kitchen Size: {params['kitchen_size'].title()}")
        print(f"   Renovation Scope: {params['scope'].title()}")  
        print(f"   Quality Tier: {params['quality_tier'].title()}")
        print("\n" + "="*80)
        
        # Get template factors
        size_factor = self.template['sizing_factors']['kitchen_size'][params['kitchen_size']]
        scope_factor = self.template['sizing_factors']['renovation_scope'][params['scope']]
        quality_factor = self.template['quality_tiers'][params['quality_tier']]
        
        # Determine included phases
        phases_included = scope_factor.get('phases_included', 'all')
        if phases_included == 'all':
            included_phases = self.template['phases']
        else:
            included_phases = [p for p in self.template['phases'] if p['phase_id'] in phases_included]
        
        # Generate detailed line items
        line_items = []
        total_labor_hours = 0
        total_material_cost = 0
        
        for phase in included_phases:
            phase_items = self._process_phase(phase, params, size_factor, quality_factor)
            line_items.extend(phase_items)
            
            for item in phase_items:
                if item['category'] == 'labor':
                    total_labor_hours += item['hours']
                else:
                    total_material_cost += item['total_cost']
        
        # Apply complexity multipliers
        complexity = size_factor['complexity_multiplier'] * scope_factor['complexity_multiplier']
        adjusted_hours = total_labor_hours * complexity
        adjusted_materials = total_material_cost * quality_factor['material_multiplier']
        
        # Calculate labor cost
        labor_rate = self.template['labor_rates']['skilled']['typical']
        labor_cost = adjusted_hours * labor_rate
        
        total_cost = labor_cost + adjusted_materials
        
        # Format output
        self._print_detailed_estimate(line_items, {
            'raw_hours': total_labor_hours,
            'adjusted_hours': adjusted_hours,
            'complexity_multiplier': complexity,
            'quality_multiplier': quality_factor['material_multiplier'],
            'labor_cost': labor_cost,
            'material_cost': adjusted_materials,
            'total_cost': total_cost
        })
        
        return {
            'line_items': line_items,
            'totals': {
                'labor_hours': adjusted_hours,
                'labor_cost': labor_cost,
                'material_cost': adjusted_materials,
                'total_cost': total_cost
            }
        }
    
    def _process_phase(self, phase, params, size_factor, quality_factor):
        """Process individual phase into line items"""
        items = []
        
        # Process tasks (labor)
        for task in phase.get('tasks', []):
            items.append({
                'category': 'labor',
                'phase': phase['phase_name'],
                'description': task['task'],
                'hours': task.get('labor_hours', 0),
                'rate': self.template['labor_rates'][task.get('hourly_rate_category', 'skilled')]['typical'],
                'total_cost': task.get('labor_hours', 0) * self.template['labor_rates'][task.get('hourly_rate_category', 'skilled')]['typical']
            })
        
        # Process materials  
        for material in phase.get('materials', []):
            quantity = material.get('quantity', 0)
            unit_cost = material.get('unit_cost_base', 0)
            waste_factor = material.get('waste_factor', 0)
            
            items.append({
                'category': 'material',
                'phase': phase['phase_name'],
                'description': material['item'],
                'quantity': quantity,
                'unit': material.get('unit', 'each'),
                'unit_cost': unit_cost,
                'waste_factor': waste_factor,
                'total_cost': quantity * unit_cost * (1 + waste_factor)
            })
        
        return items
    
    def _print_detailed_estimate(self, line_items, totals):
        """Print formatted estimate"""
        
        print(f"📊 DETAILED ESTIMATE")
        print("="*80)
        
        # Group by phase
        phases = {}
        for item in line_items:
            phase = item['phase']
            if phase not in phases:
                phases[phase] = {'labor': [], 'materials': []}
            
            if item['category'] == 'labor':
                phases[phase]['labor'].append(item)
            else:
                phases[phase]['materials'].append(item)
        
        # Print each phase
        for phase_name, items in phases.items():
            print(f"\n🔨 {phase_name}")
            print("-" * 60)
            
            # Labor items
            if items['labor']:
                print("Labor:")
                for item in items['labor']:
                    print(f"  • {item['description']:<40} {item['hours']:>3.0f} hrs @ ${item['rate']:>2.0f}/hr = ${item['total_cost']:>6,.0f}")
            
            # Material items  
            if items['materials']:
                print("Materials:")
                for item in items['materials']:
                    if item['total_cost'] > 0:
                        print(f"  • {item['description']:<40} ${item['total_cost']:>6,.0f}")
        
        # Totals
        print("\n" + "="*80)
        print("ESTIMATE SUMMARY")
        print("="*80)
        print(f"Base Labor Hours:      {totals['raw_hours']:>8.0f}")
        print(f"Complexity Multiplier: {totals['complexity_multiplier']:>8.1f}x")
        print(f"Adjusted Labor Hours:  {totals['adjusted_hours']:>8.0f}")
        print(f"Labor Cost:            ${totals['labor_cost']:>8,.0f}")
        print("-" * 40)
        print(f"Base Material Cost:    ${totals['material_cost']/totals['quality_multiplier']:>8,.0f}")
        print(f"Quality Multiplier:    {totals['quality_multiplier']:>8.1f}x") 
        print(f"Adjusted Materials:    ${totals['material_cost']:>8,.0f}")
        print("="*40)
        print(f"TOTAL PROJECT COST:    ${totals['total_cost']:>8,.0f}")
        print("="*40)


def main():
    """Demonstrate estimate generation"""
    
    # Initialize generator with template
    template_path = Path(__file__).parent / 'trade_library' / 'multi_trade' / 'kitchen_renovation_complete.json'
    generator = EstimateGenerator(template_path)
    
    # Test scenarios
    scenarios = [
        "I want to remodel my small kitchen with new cabinets, countertops and appliances",
        "Complete gut renovation of large luxury kitchen with custom everything",
        "Budget refresh of medium kitchen - just paint cabinets and new countertops"
    ]
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"\n🏠 SCENARIO {i}")
        print("="*80)
        estimate = generator.generate_estimate(scenario)
        print("\n\n")

if __name__ == "__main__":
    main()