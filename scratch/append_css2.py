import os

css_more = """
/* Admin Dashboard Toolbar & Quick Chat Phrases */
.admin-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  gap: 10px;
}

.admin-counter {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}

.admin-inline-input {
  display: flex;
  gap: 8px;
  width: 100%;
}

.admin-inline-input input {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 7px 12px;
  color: #fff;
  font-size: 13px;
  outline: none;
}

.admin-inline-input input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.35);
}

.admin-phrases-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
  margin-top: 8px;
}

.phrase-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #e2e8f0;
}

.phrase-item .phrase-text {
  font-weight: 500;
}

.btn-sm-secondary {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #e2e8f0;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-sm-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(56, 189, 248, 0.5);
}

.token-code {
  font-family: monospace;
  background: rgba(0, 0, 0, 0.35);
  padding: 2px 6px;
  border-radius: 4px;
  color: #38bdf8;
  font-size: 11px;
}
"""

with open('public/style.css', 'a', encoding='utf-8') as f:
    f.write(css_more)

print("Additional CSS appended successfully!")
