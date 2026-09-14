import base64
import contextlib
import io
import json
import os
import sqlite3
import sys
import tempfile
import time
import traceback


def normalize(value):
    try:
        import pandas as pd
        if isinstance(value, pd.DataFrame):
            return {"records": value.to_dict(orient="records")}
        if isinstance(value, pd.Series):
            return {"records": value.to_list()}
    except Exception:
        pass
    return {"value": value}


def run(payload):
    started = time.time()
    code = payload["code"]
    tests = payload["tests"]
    datasets = payload.get("datasets", [])
    results = []
    stdout = io.StringIO()
    stderr = io.StringIO()

    with tempfile.TemporaryDirectory() as tempdir:
        for dataset in datasets:
            with open(os.path.join(tempdir, dataset["filename"]), "w", encoding="utf-8") as handle:
                handle.write(dataset["content"])

        old_cwd = os.getcwd()
        os.chdir(tempdir)
        namespace = {"__builtins__": __builtins__}
        try:
            with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                exec(compile(code, "student_submission.py", "exec"), namespace)
                solve = namespace.get("solve")
                if not callable(solve):
                    raise RuntimeError("A callable solve function is required.")
                for test in tests:
                    args = test.get("input", {}).get("args", [])
                    actual = normalize(solve(*args))
                    expected = test["expectedOutput"]
                    results.append({"passed": actual == expected})
        except Exception:
            stderr.write(traceback.format_exc(limit=4))
            return {
                "status": "ERROR",
                "stdout": stdout.getvalue(),
                "stderr": stderr.getvalue(),
                "executionTime": int((time.time() - started) * 1000),
                "results": results,
            }
        finally:
            os.chdir(old_cwd)

    return {
        "status": "PASSED" if all(item["passed"] for item in results) else "FAILED",
        "stdout": stdout.getvalue(),
        "stderr": stderr.getvalue(),
        "executionTime": int((time.time() - started) * 1000),
        "results": results,
    }


def run_sql(payload):
    started = time.time()
    results = []
    stdout = io.StringIO()
    stderr = io.StringIO()

    try:
        for test in payload["tests"]:
            conn = sqlite3.connect(":memory:")
            conn.row_factory = sqlite3.Row
            try:
                for statement in test.get("input", {}).get("setupSql", []):
                    conn.execute(statement)
                cursor = conn.execute(payload["code"])
                rows = [dict(row) for row in cursor.fetchall()]
                expected = test["expectedOutput"].get("rows", [])
                results.append({"passed": rows == expected})
            finally:
                conn.close()
    except Exception:
        stderr.write(traceback.format_exc(limit=4))
        return {
            "status": "ERROR",
            "stdout": stdout.getvalue(),
            "stderr": stderr.getvalue(),
            "executionTime": int((time.time() - started) * 1000),
            "results": results,
        }

    return {
        "status": "PASSED" if all(item["passed"] for item in results) else "FAILED",
        "stdout": stdout.getvalue(),
        "stderr": stderr.getvalue(),
        "executionTime": int((time.time() - started) * 1000),
        "results": results,
    }


if __name__ == "__main__":
    payload = json.loads(base64.b64decode(sys.argv[1]).decode("utf-8"))
    if payload.get("type") == "SQL":
        print(json.dumps(run_sql(payload)))
    else:
        print(json.dumps(run(payload)))
