**What you'll find inside:**

**Level 1 — The Atomic Game Unit:** The foundational two-player zero-sum game structure that GANs are built on, with the minimax objective function.

**Level 2 — Domain Mapping:** A clear mapping table showing how GAN concepts translate to your software engineering agents (Generator→Dev Agents, Discriminator→Bug Engineer, etc.)

**Lens 1 (Structure):** Three architectural patterns from the paper:
- Multi-Generator/Single-Discriminator (your current setup)
- Single-Generator/Multi-Discriminator (specialized reviewers)
- Multi-Multi with MIX+GAN approach

**Lens 2 (Behavior):** The iterative game sequence diagram plus the four failure modes to avoid (Mode Collapse, Vanishing Gradient, Non-Convergence, Training Instability) with solutions from the paper.

**Lens 3 (Philosophy):** The "Adversarial Paradox" — how local zero-sum competition creates global positive-sum outcomes. The key reframe: Bug Engineer's goal is to make itself obsolete.

**Lens 4 (Visualization):** The four-phase training dynamics showing progression from early training through equilibrium.

**Synthesis:** The recommended architecture combining Stackelberg coordination, Fictitious Play history buffer, and source attribution.

**Lexicon:** Reference table mapping all technical terms between GAN and your software domain.

Want me to go deeper on any specific pattern? I can provide:
- TypeScript implementation of the game orchestrator
- Specific reward function designs
- Convergence detection algorithms
- Mode collapse detection for when dev agents produce similar solutions