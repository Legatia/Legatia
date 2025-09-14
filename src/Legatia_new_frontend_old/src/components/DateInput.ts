import { html, TemplateResult } from 'lit-html';

export class DateInput {
  private name: string;
  private label: string;
  private value: string;
  private required: boolean;
  private onChange: (value: string) => void;

  constructor(
    name: string,
    label: string,
    value: string = '',
    required: boolean = false,
    onChange: (value: string) => void = () => {}
  ) {
    this.name = name;
    this.label = label;
    this.value = value;
    this.required = required;
    this.onChange = onChange;
  }

  private parseDate(dateStr: string): { year: string; month: string; day: string; era: string } {
    if (!dateStr) return { year: '', month: '', day: '', era: 'AD' };
    
    // Handle BC/AD format like "500 BC" or "2000-01-01" or "1985-03-20 AD"
    const bcMatch = dateStr.match(/(\d+)\s*BC/i);
    if (bcMatch) {
      return { year: bcMatch[1], month: '', day: '', era: 'BC' };
    }
    
    const adMatch = dateStr.match(/(\d{4})-?(\d{2})?-?(\d{2})?\s*(AD)?/i);
    if (adMatch) {
      return {
        year: adMatch[1] || '',
        month: adMatch[2] || '',
        day: adMatch[3] || '',
        era: 'AD'
      };
    }
    
    return { year: '', month: '', day: '', era: 'AD' };
  }

  private formatDate(year: string, month: string, day: string, era: string): string {
    if (!year) return '';
    
    if (era === 'BC') {
      return `${year} BC`;
    }
    
    if (month && day) {
      return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else if (month) {
      return `${year.padStart(4, '0')}-${month.padStart(2, '0')}`;
    } else {
      return year;
    }
  }

  private validateYear(year: string): boolean {
    const yearNum = parseInt(year);
    return yearNum >= 1 && yearNum <= 9999;
  }

  private handleInputChange = (e: Event): void => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const field = target.dataset.field;
    const value = target.value;
    
    const parsed = this.parseDate(this.value);
    
    if (field === 'year') {
      if (value && !this.validateYear(value)) {
        target.setCustomValidity('Year must be between 1 and 9999');
        return;
      }
      target.setCustomValidity('');
      parsed.year = value;
    } else if (field === 'month') {
      parsed.month = value;
    } else if (field === 'day') {
      parsed.day = value;
    } else if (field === 'era') {
      parsed.era = value;
      // Clear month/day if switching to BC since we typically don't have precise dates
      if (value === 'BC') {
        parsed.month = '';
        parsed.day = '';
      }
    }
    
    const newValue = this.formatDate(parsed.year, parsed.month, parsed.day, parsed.era);
    this.value = newValue;
    this.onChange(newValue);
  };

  render(): TemplateResult {
    const parsed = this.parseDate(this.value);
    const isBC = parsed.era === 'BC';
    
    return html`
      <div class="date-input">
        <label class="date-label">${this.label}:</label>
        <div class="date-fields">
          <div class="year-era-group">
            <input
              type="number"
              placeholder="Year"
              .value=${parsed.year}
              data-field="year"
              min="1"
              max="9999"
              @input=${this.handleInputChange}
              class="year-input"
              ?required=${this.required}
            />
            <select
              data-field="era"
              .value=${parsed.era}
              @change=${this.handleInputChange}
              class="era-select"
            >
              <option value="AD">AD</option>
              <option value="BC">BC</option>
            </select>
          </div>
          
          ${!isBC ? html`
            <input
              type="number"
              placeholder="Month"
              .value=${parsed.month}
              data-field="month"
              min="1"
              max="12"
              @input=${this.handleInputChange}
              class="month-input"
            />
            <input
              type="number"
              placeholder="Day"
              .value=${parsed.day}
              data-field="day"
              min="1"
              max="31"
              @input=${this.handleInputChange}
              class="day-input"
            />
          ` : ''}
        </div>
        <input type="hidden" name=${this.name} .value=${this.value} />
        ${isBC ? html`
          <small class="date-help">BC dates show year only</small>
        ` : html`
          <small class="date-help">Leave month/day empty for year-only dates</small>
        `}
      </div>
    `;
  }
}