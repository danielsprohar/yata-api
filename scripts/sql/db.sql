-- Create Workspaces table
CREATE TABLE Workspaces (
    workspace_id BINARY(16) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    public BOOLEAN NOT NULL DEFAULT false,
    owner_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Projects table
CREATE TABLE Projects (
    project_id BINARY(16) PRIMARY KEY,
    workspace_id BINARY(16) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('Not Started', 'In Progress', 'Completed') DEFAULT 'Not Started',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES Workspaces(workspace_id) ON DELETE CASCADE
);

-- Create Tasks table with recursive relationship
CREATE TABLE Tasks (
    task_id BINARY(16) PRIMARY KEY,
    project_id BINARY(16) NOT NULL,
    parent_task_id BINARY(16),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('Not Started', 'In Progress', 'Completed') DEFAULT 'Not Started',
    due_date DATE,
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES Projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_workspace_id ON Projects(workspace_id);
CREATE INDEX idx_project_id ON Tasks(project_id);
CREATE INDEX idx_parent_task_id ON Tasks(parent_task_id);
