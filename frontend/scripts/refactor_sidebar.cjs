const fs = require('fs');

const sidebarPath = '/Users/ayushdas/Documents/SEED2SELF/frontend/components/common/Sidebar/Sidebar.tsx';
let content = fs.readFileSync(sidebarPath, 'utf8');

// Remove Trace Produce from inner menus
content = content.replace(/<Link\s+href="\/home\/trace-product"[\s\S]*?<\/Link>/g, '');

// Now we want to add a top-level Trace Lineage before the Support link for each role.
// We can find all the Support links and insert it right before them.
const supportRegex = /({[^}]*Support[^}]*}\s*<Link\s+href="\/support")/g;

const traceLink = `{/* Trace Lineage */}
                <Link
                  href="/trace-lineage"
                  onClick={onClose}
                  className={\`flex items-center gap-3 px-3 py-2.5 rounded-xl transition \${
                    isActive("/trace-lineage")
                      ? "bg-[#00d26a]/15 text-[#00d26a] border border-[#00d26a]/20 font-bold"
                      : "text-stone-300 hover:text-white hover:bg-white/5"
                  }\`}
                >
                  <GitBranch className="w-4 h-4 text-[#00d26a]" />
                  <span>Trace Lineage</span>
                </Link>

                `;

content = content.replace(supportRegex, traceLink + '$1');

fs.writeFileSync(sidebarPath, content);
