# Problem Set Scoring

Script to automatically score problem sets submitted via GitHub Classroom and update scores on Canvas. Checks the Travis Build status for each problem set; if the build passes, it is considered complete.

## Setup

1. Create a file **`github.token`** that contains your [GitHub OAuth token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/) (as the file contents).

2. Create a file **`canvas.key`** that contains your [Canvas API Key](https://canvas.instructure.com/doc/api/oauth.html) (as the file contents).

3. Create a spreadsheet file **`students.csv`** that contains two columns: `uwnetid` and `github` containing students UWNetIDs and GitHub usernames respectively. Include a header row with `uwnetid` and `github` as values.

4. Fill in the course and assignment information in the **`course.json`** file. Canvas IDs can be found in the URL for individual assignments.

    Each assignment should have a `repo_slug` that is the prefix given to individual repos by GitHub classroom. You can include an optional `branch` property if the submitted solution isn't on the `master` branch.

5. Install package dependencies.

    ```bash
    npm install
    ```

## Usage

You can run the script with node:

```bash
node app.js
```

The script accepts the following command line arguments:

- `-p repo_slug` will only score assignments in `course.json` that contain the given repo slug (`repo_slug`). This lets you only score a single assignment at a time.
