# Todoist Widget

A widget that integrates with Todoist to display and manage your tasks directly in Boxento.

## Features

- Display tasks from your Todoist account
- Mark tasks as complete/incomplete
- Filter tasks by project
- Show/hide completed tasks
- Limit the number of displayed tasks
- View task due dates
- Quick link to open tasks in Todoist

## Setup

1. Get your Todoist API token:
   - Log in to [Todoist](https://todoist.com)
   - Go to Settings → Integrations
   - Copy your API token

2. Configure the widget:
   - Click the settings icon in the widget header
   - Paste your API token
   - (Optional) Configure additional settings:
     - Project ID: Filter tasks to a specific project
     - Show Completed Tasks: Toggle visibility of completed tasks
     - Maximum Tasks: Set the maximum number of tasks to display

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| API Token | Your Todoist API token (required) | - |
| Project ID | ID of a specific project to show tasks from (optional) | All projects |
| Show Completed Tasks | Whether to display completed tasks | false |
| Maximum Tasks | Maximum number of tasks to display | 10 |

## API Usage

This widget uses the [Todoist REST API v2](https://developer.todoist.com/rest/v2) to:
- Fetch tasks (`GET /tasks`)
- Close tasks (`POST /tasks/{id}/close`)
- Reopen tasks (`POST /tasks/{id}/reopen`)

## Responsive Sizing

The widget adapts to different sizes while maintaining functionality:
- Minimum size: 2x2
- Shows scrollable list of tasks
- Maintains consistent task item height
- Preserves all functionality regardless of size

## Error Handling

The widget handles various error states:
- Missing API token
- Invalid API token
- Network errors
- Empty task list 