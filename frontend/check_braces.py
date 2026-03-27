filename = "/Users/bng/Downloads/OBD promotions/frontend/src/components/SCPFlowDiagram.js"
with open(filename, 'r') as f:
    content = f.read()

stack = []
for i, char in enumerate(content):
    if char == '{':
        stack.append(i)
    elif char == '}':
        if not stack:
            print(f"Extra '}}' found near character {i}: ... {content[max(0, i-30):i+30]} ...")
        else:
            stack.pop()

if stack:
    for s in stack:
        print(f"Unmatched '{{' found near character {s}: ... {content[max(0, s-30):s+30]} ...")
else:
    print("All braces are balanced.")

# Also check parentheses
stack_p = []
for i, char in enumerate(content):
    if char == '(':
        stack_p.append(i)
    elif char == ')':
        if not stack_p:
            print(f"Extra ')' found near character {i}: ... {content[max(0, i-30):i+30]} ...")
        else:
            stack_p.pop()

if stack_p:
    for s in stack_p:
        print(f"Unmatched '(' found near character {s}: ... {content[max(0, s-30):s+30]} ...")
else:
    print("All parentheses are balanced.")
