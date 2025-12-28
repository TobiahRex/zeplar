# 7. User Flows

[← Back to Index](./index.md) | [← Previous: App Architecture](./06-app-architecture.md)

---

## 7.1 Study Session Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1e1e2e', 'primaryTextColor': '#cdd6f4', 'primaryBorderColor': '#89b4fa', 'lineColor': '#cdd6f4', 'secondaryColor': '#313244', 'tertiaryColor': '#45475a', 'background': '#1e1e2e'}}}%%
flowchart TD
    subgraph STUDY["📚 STUDY SESSION FLOW"]
        START([🎯 Start Study])
        QUEUE["📋 Compute Queue<br/><em>Priority: Overdue > Due > New</em><br/><em>Max 20 cards, respect layer progression</em>"]
        FRONT["🃏 Show Card Front<br/><em>Question based on card type</em>"]
        BACK["🔄 Show Card Back<br/><em>Answer + explanation</em><br/><em>+ Rating Buttons</em>"]
        UPDATE["💾 Update Progress<br/><em>SM-2 algorithm</em><br/><em>Persist to Redux + IDB</em>"]
        CHECK{More cards?}
        SUMMARY["📊 Session Summary<br/><em>+ Stats Update</em>"]

        START --> QUEUE
        QUEUE --> FRONT
        FRONT -->|"👆 User taps to reveal"| BACK
        BACK -->|"⭐ User rates 0-5"| UPDATE
        UPDATE --> CHECK
        CHECK -->|"✅ Yes"| FRONT
        CHECK -->|"🏁 No"| SUMMARY
    end

    style START fill:#a6e3a1,stroke:#a6e3a1,color:#1e1e2e
    style QUEUE fill:#89b4fa,stroke:#89b4fa,color:#1e1e2e
    style FRONT fill:#f9e2af,stroke:#f9e2af,color:#1e1e2e
    style BACK fill:#fab387,stroke:#fab387,color:#1e1e2e
    style UPDATE fill:#cba6f7,stroke:#cba6f7,color:#1e1e2e
    style CHECK fill:#f38ba8,stroke:#f38ba8,color:#1e1e2e
    style SUMMARY fill:#a6e3a1,stroke:#a6e3a1,color:#1e1e2e
    style STUDY fill:#313244,stroke:#89b4fa,color:#cdd6f4
```

---

## 7.2 Exploration Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1e1e2e', 'primaryTextColor': '#cdd6f4', 'primaryBorderColor': '#89b4fa', 'lineColor': '#cdd6f4', 'secondaryColor': '#313244', 'tertiaryColor': '#45475a', 'background': '#1e1e2e'}}}%%
flowchart TD
    subgraph ENTRY["🚪 ENTRY POINTS"]
        SEARCH["🔍 Search Bar<br/><em>Free text search</em>"]
        TREE["🌳 Hierarchy Tree<br/><em>Click through levels</em>"]
        GRAPH["🕸️ Graph View<br/><em>Visual exploration</em>"]
        SYSTEM["🏢 System View<br/><em>See what X company uses</em>"]
    end

    subgraph DETAIL["📋 PATTERN DETAIL VIEW"]
        direction TB

        subgraph TABS["📑 Layer Tabs"]
            T1["💡 Concept<br/>L1"]
            T2["📐 Structure<br/>L2"]
            T3["💻 Code<br/>L3"]
            T4["🌐 System<br/>L4"]
            T5["🔧 Tech<br/>L5"]
            T6["🏛️ Used By<br/>L6"]
        end

        subgraph PROGRESS["📊 Progress Indicator"]
            P1["Layer 1: ████████░░ 80% ✅"]
            P2["Layer 2: ██████░░░░ 60% ✅"]
            P3["Layer 3: ████░░░░░░ 40% ✅"]
            P4["Layer 4: 🔒 Locked"]
            P5["Layer 5: 🔒 Locked"]
            P6["Layer 6: 🔒 Locked"]
        end

        subgraph ACTIONS["⚡ Actions"]
            STUDY_BTN["📚 Study This Pattern"]
            RELATED_BTN["🔗 Related Patterns"]
        end
    end

    SEARCH --> DETAIL
    TREE --> DETAIL
    GRAPH --> DETAIL
    SYSTEM --> DETAIL

    style SEARCH fill:#89b4fa,stroke:#89b4fa,color:#1e1e2e
    style TREE fill:#a6e3a1,stroke:#a6e3a1,color:#1e1e2e
    style GRAPH fill:#f9e2af,stroke:#f9e2af,color:#1e1e2e
    style SYSTEM fill:#fab387,stroke:#fab387,color:#1e1e2e

    style T1 fill:#b4befe,stroke:#b4befe,color:#1e1e2e
    style T2 fill:#89dceb,stroke:#89dceb,color:#1e1e2e
    style T3 fill:#a6e3a1,stroke:#a6e3a1,color:#1e1e2e
    style T4 fill:#f9e2af,stroke:#f9e2af,color:#1e1e2e
    style T5 fill:#fab387,stroke:#fab387,color:#1e1e2e
    style T6 fill:#f38ba8,stroke:#f38ba8,color:#1e1e2e

    style P1 fill:#a6e3a1,stroke:#a6e3a1,color:#1e1e2e
    style P2 fill:#a6e3a1,stroke:#a6e3a1,color:#1e1e2e
    style P3 fill:#f9e2af,stroke:#f9e2af,color:#1e1e2e
    style P4 fill:#6c7086,stroke:#6c7086,color:#cdd6f4
    style P5 fill:#6c7086,stroke:#6c7086,color:#cdd6f4
    style P6 fill:#6c7086,stroke:#6c7086,color:#cdd6f4

    style STUDY_BTN fill:#cba6f7,stroke:#cba6f7,color:#1e1e2e
    style RELATED_BTN fill:#89b4fa,stroke:#89b4fa,color:#1e1e2e

    style ENTRY fill:#313244,stroke:#89b4fa,color:#cdd6f4
    style DETAIL fill:#313244,stroke:#cba6f7,color:#cdd6f4
    style TABS fill:#45475a,stroke:#89b4fa,color:#cdd6f4
    style PROGRESS fill:#45475a,stroke:#a6e3a1,color:#cdd6f4
    style ACTIONS fill:#45475a,stroke:#f38ba8,color:#cdd6f4
```

---

## 7.3 Onboarding Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1e1e2e', 'primaryTextColor': '#cdd6f4', 'primaryBorderColor': '#89b4fa', 'lineColor': '#cdd6f4', 'secondaryColor': '#313244', 'tertiaryColor': '#45475a', 'background': '#1e1e2e'}}}%%
flowchart TD
    WELCOME["👋 Welcome Screen"]
    EXPLAIN["📖 Explain 6 Layers"]
    EXPLAIN2["🎯 Explain SBVP Domains"]
    EXPLAIN3["📅 Explain Spaced Repetition"]
    QUIZ["❓ Optional Placement Quiz"]
    START["🚀 Start with Layer 1"]

    WELCOME --> EXPLAIN --> EXPLAIN2 --> EXPLAIN3 --> QUIZ --> START

    style WELCOME fill:#cba6f7,stroke:#cba6f7,color:#1e1e2e
    style EXPLAIN fill:#89b4fa,stroke:#89b4fa,color:#1e1e2e
    style EXPLAIN2 fill:#a6e3a1,stroke:#a6e3a1,color:#1e1e2e
    style EXPLAIN3 fill:#f9e2af,stroke:#f9e2af,color:#1e1e2e
    style QUIZ fill:#fab387,stroke:#fab387,color:#1e1e2e
    style START fill:#a6e3a1,stroke:#a6e3a1,color:#1e1e2e
```

---

[Next: Data Pipeline →](./08-data-pipeline.md)
