# [NEW] Hackathon Winner Phase - Implementation Plan

This plan outlines the implementation of four high-impact features designed to secure a hackathon victory by adding advanced AI reasoning, visual analytics, and forensic code verification.

## Proposed Changes

### 1. Global "Recruiter Brain" (Cross-Candidate Search)

A dedicated interface to query the entire talent pool using natural language.

#### [MODIFY] [main.py](file:///c:/Users/dell/Desktop/xnords/main.py)
- **New Endpoint**: `POST /search_candidates`
- **Logic**: 
    - Takes a search query (e.g., "Find me a backend dev with AWS exposure").
    - Fetches all candidate records.
    - Sends candidate summaries and query to LLM.
    - Returns a ranked list with relevance explanations.

#### [MODIFY] [DashboardPage.tsx](file:///c:/Users/dell/Desktop/xnords/frontend/src/app/dashboard/page.tsx)
- **State**: `searchQuery`, `searchResults`, `isSearching`.
- **UI**: Add a search bar or chat bubble in the sidebar for "Global Brain".
- **Interface**: Display ranked results with a "View Profile" link.

---

### 2. Neural Radar Maps (Visual Comparison)

Visualizing candidate strengths in the Battle Royale modal.

#### [NEW] [RadarChart.tsx](file:///c:/Users/dell/Desktop/xnords/frontend/src/components/RadarChart.tsx)
- **Component**: A reusable radar chart using `recharts`.
- **Styling**: Glassmorphism and glowing strokes to match the premium theme.

#### [MODIFY] [DashboardPage.tsx](file:///c:/Users/dell/Desktop/xnords/frontend/src/app/dashboard/page.tsx)
- **Integration**: Insert the `<RadarChart />` into the `battle` modal.
- **Data Mapping**: Map `score_breakdown` from the comparison results to the chart axes.

---

### 3. GitHub Repo Deep-Dive (Code Verification)

Verifying claimed skills by analyzing actual repository content.

#### [MODIFY] [main.py](file:///c:/Users/dell/Desktop/xnords/main.py)
- **Update Logic**: When a GitHub URL is found:
    - Call GitHub API to get top 3 repositories.
    - Fetch `README.md` for these repos.
    - Send READMEs to LLM to assess technical complexity.
    - Return a `verified_skill_depth` summary.

#### [MODIFY] [api.ts](file:///c:/Users/dell/Desktop/xnords/frontend/src/lib/api.ts)
- **Model**: Update `Candidate` type to include `github_deep_dive`.

---

### 4. Forensic PDF Highlighter

Visual evidence of AI reasoning on the resume itself.

#### [MODIFY] [main.py](file:///c:/Users/dell/Desktop/xnords/main.py)
- **Extraction**: Extend `process_resume_task` to return bounding box coordinates (page, x, y, w, h) for identified "Red Flags" or "Key Achievements".

#### [MODIFY] [DashboardPage.tsx](file:///c:/Users/dell/Desktop/xnords/frontend/src/app/dashboard/page.tsx)
- **UI**: Add a transparent canvas layer over the PDF iframe in the Inspector.
- **Logic**: Draw glowing highlights based on the coordinates provided by the backend.

## Verification Plan

### Automated Tests
- `pytest` for `/search_candidates` endpoint.
- Verify GitHub API response handling for public repos.

### Manual Verification
- Perform a Battle Royale and verify radar chart accurately reflects scores.
- Search for a specific skill and ensure Global Brain returns correct candidates.
- Open PDF Analyzer and check if red flags are visually highlighted.
