#!/usr/bin/env python3
"""
Script to update requirements.txt to the latest versions of packages
"""
import subprocess
import sys
import re
from packaging import version

def get_latest_version(package_name):
    """Get the latest version of a package from PyPI"""
    try:
        result = subprocess.run([sys.executable, "-m", "pip", "index", "versions", package_name], 
                              capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            # Extract latest version from pip index output
            for line in result.stdout.split('\n'):
                if 'Available versions:' in line:
                    versions_str = line.split('Available versions:')[1].strip()
                    versions = [v.strip() for v in versions_str.split(',')]
                    # Sort versions and return the highest
                    latest = sorted(versions, key=version.parse, reverse=True)[0]
                    return latest.strip()
        # Fallback: try pip show after installing latest
        subprocess.run([sys.executable, "-m", "pip", "install", "--upgrade", "--dry-run", package_name], 
                      capture_output=True, text=True)
    except Exception as e:
        print(f"Could not get latest version for {package_name}: {e}")
    return None

def update_requirements():
    with open('requirements.txt', 'r') as f:
        lines = f.readlines()
    
    updated_lines = []
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            updated_lines.append(line + '\n')
            continue
            
        # Handle extras like uvicorn[standard]
        extras = ''
        if '[' in line and ']' in line:
            package_part = line.split('[')[0]
            extras = '[' + line.split('[')[1].split(']')[0] + ']'
            package_name = package_part
        else:
            package_name = line.split('==')[0].split('>=')[0].split('<=')[0].split('>')[0].split('<')[0].split('~=')[0].split('!=')[0]
        
        # Remove version specifiers to get clean package name
        clean_package_name = re.split(r'[=<>!~]', package_name)[0].strip()
        
        print(f"Checking latest version for: {clean_package_name}")
        latest_version = get_latest_version(clean_package_name)
        
        if latest_version:
            updated_lines.append(f"{clean_package_name}{extras}=={latest_version}\n")
            print(f"Updated {clean_package_name} to version {latest_version}")
        else:
            updated_lines.append(line + '\n')
            print(f"Could not update {clean_package_name}, keeping original")
    
    with open('requirements.txt', 'w') as f:
        f.writelines(updated_lines)
    
    print("requirements.txt updated!")

if __name__ == "__main__":
    # Install packaging module if not present
    try:
        import packaging
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "packaging"])
        import packaging
    
    update_requirements()