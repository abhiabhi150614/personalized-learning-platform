I'll help you create a detailed documentation file for your learning app.

```markdown:learning-app/docs/project-documentation.md
# Learning App Documentation

## Overview
The Learning App is a comprehensive educational platform that helps users manage their learning journey through various features including career path tracking, daily topics, AI assistance, focused study mode, and YouTube learning integration.

## Core Features

### 1. Career Path Management
**Location:** `app/(tabs)/home.tsx`
- Generates personalized career paths using Gemini AI
- Tracks progress through milestones
- Components:
  - Career path generation modal
  - Progress visualization
  - Milestone tracking

```typescript
// Example career path structure
interface CareerPath {
  id: string;
  user_id: string;
  status: 'active' | 'completed';
  learning_goal: string;
  milestones: Milestone[];
}
```

### 2. Daily Topics System
**Location:** `app/(tabs)/home.tsx`, `services/topics.ts`
- Provides daily learning objectives
- Features:
  - Topic scheduling
  - Progress tracking
  - Completion feedback
  - Skills coverage tracking

```typescript
interface DailyTopic {
  id: string;
  title: string;
  description: string;
  estimated_minutes: number;
  skills_covered: string[];
  prerequisites: string[];
  resources: string[];
  practice_tasks: string[];
}
```

### 3. AI Study Assistant
**Location:** `app/features/ai-assistant.tsx`, `services/ai-assistant.ts`
- Powered by Google's Gemini API
- Features:
  - Real-time question answering
  - Learning guidance
  - Code explanations
  - Concept clarification

### 4. YouTube Learning Tracker
**Location:** `app/features/youtube-tracking.tsx`, `services/youtube.ts`
- Tracks learning progress through YouTube content
- Features:
  - Playlist progress tracking
  - Video completion tracking
  - Time estimation
  - Learning statistics

### 5. Focused Study Mode
**Location:** `app/features/focused-study.tsx`, `services/focus-monitor.ts`
- Helps maintain study focus
- Features:
  - Video integration
  - Study session tracking
  - Focus monitoring (prepared for AI integration)

## Technical Architecture

### State Management
- Uses React's useState and useEffect for local state
- Custom hooks for shared functionality:
  - `useLearningStats`
  - `useDailyTopics`
  - `useCareerPath`

### Data Layer
**Database:** Supabase
- Tables:
  1. profiles
  2. career_paths
  3. career_milestones
  4. daily_topics
  5. learning_stats
  6. user_courses

### Authentication
- Managed through Supabase Auth
- Protected routes using auth context
- Session management

### API Integration
1. **Gemini AI API**
   - Used for: Career path generation, AI assistance
   - Implementation: `services/gemini.ts`

2. **YouTube Data API**
   - Used for: Video progress tracking
   - Implementation: `services/youtube.ts`

## UI Components

### Navigation
- Tab-based navigation
- Stack navigation for features
- Protected routes handling

### Shared Components
1. **FeatureBox**
```typescript
interface FeatureBoxProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
}
```

2. **Progress Bar**
```typescript
interface ProgressBarProps {
  progress: number;
  color: string;
  height?: number;
}
```

### Styling
- Theme-based styling using constants:
  - `constants/colors.ts`
  - `constants/fonts.ts`
- Consistent styling across components
- Responsive design considerations

## Feature Workflows

### Career Path Generation
1. User initiates generation
2. Profile data sent to Gemini AI
3. AI generates milestones
4. Milestones saved to database
5. Daily topics generated based on milestones

### Daily Topic Flow
1. Topics scheduled based on career path
2. Daily check for new topics
3. User completes topics
4. Progress tracked and stats updated
5. Next topic scheduled

### Focus Mode Workflow
1. User enters video URL
2. Video loaded in WebView
3. Study session tracked
4. Progress saved to learning stats

## Error Handling
- Comprehensive error catching
- User-friendly error messages
- Fallback states for failed operations
- Network error handling

## Performance Considerations
- Lazy loading of features
- Optimized API calls
- Efficient state management
- Resource cleanup

## Security
- Protected API keys
- Authenticated routes
- Data validation
- Secure storage practices

## Future Enhancements
1. AI Focus Detection Integration
2. Enhanced Analytics
3. Social Learning Features
4. Offline Support
5. Advanced Progress Tracking

## Development Guidelines
1. Code Structure
   - Feature-based organization
   - Shared services
   - Reusable components

2. Naming Conventions
   - PascalCase for components
   - camelCase for functions
   - snake_case for database fields

3. Testing Strategy
   - Component testing
   - Integration testing
   - API testing

## Deployment
- Expo build system
- Environment configuration
- API key management
- Version control

## Maintenance
- Regular dependency updates
- Performance monitoring
- Error tracking
- User feedback integration

This documentation provides a comprehensive overview of the Learning App's architecture, features, and technical implementation. For specific implementation details, refer to the individual component files and services.
```

This documentation:
1. Covers all major features
2. Explains technical architecture
3. Details component structure
4. Provides implementation insights
5. Includes future considerations
6. Serves as a development guide

Let me know if you need any section expanded or have questions!
