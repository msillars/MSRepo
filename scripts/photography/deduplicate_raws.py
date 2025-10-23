#!/usr/bin/env python3
"""
RAW File Deduplication Scanner
Finds duplicate RAW files (ARW, DNG) on Synology NAS using file hashing.
Designed to run at low priority without impacting system performance.

Usage:
    python deduplicate_raws.py /path/to/photos --output report.csv
    
    On Synology NAS via SSH:
    nice -n 19 python3 deduplicate_raws.py /volume1/photos --output /volume1/reports/duplicates.csv
"""

import os
import sys
import hashlib
import argparse
import csv
import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict
import time

# Supported RAW formats
RAW_EXTENSIONS = {'.arw', '.dng', '.raw', '.cr2', '.nef', '.orf', '.rw2', '.pef', '.srw'}

class ProgressTracker:
    """Track and display scanning progress"""
    def __init__(self, total_files):
        self.total = total_files
        self.processed = 0
        self.start_time = time.time()
        self.last_update = 0
        
    def update(self, filepath):
        self.processed += 1
        current_time = time.time()
        
        # Update display every 5 seconds
        if current_time - self.last_update >= 5:
            elapsed = current_time - self.start_time
            rate = self.processed / elapsed if elapsed > 0 else 0
            remaining = (self.total - self.processed) / rate if rate > 0 else 0
            
            print(f"Progress: {self.processed}/{self.total} files "
                  f"({self.processed/self.total*100:.1f}%) | "
                  f"Rate: {rate:.1f} files/sec | "
                  f"ETA: {remaining/60:.1f} min", flush=True)
            
            self.last_update = current_time

def calculate_file_hash(filepath, chunk_size=8192):
    """
    Calculate SHA256 hash of a file.
    Reads in chunks to handle large RAW files efficiently.
    """
    sha256_hash = hashlib.sha256()
    try:
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(chunk_size), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()
    except Exception as e:
        print(f"Error hashing {filepath}: {e}", file=sys.stderr)
        return None

def find_raw_files(root_path):
    """
    Recursively find all RAW files in the directory tree.
    Returns list of Path objects.
    """
    raw_files = []
    root = Path(root_path)
    
    print(f"Scanning directory structure: {root_path}")
    for file_path in root.rglob('*'):
        if file_path.is_file() and file_path.suffix.lower() in RAW_EXTENSIONS:
            raw_files.append(file_path)
    
    print(f"Found {len(raw_files)} RAW files to process")
    return raw_files

def find_duplicates(raw_files, progress_callback=None):
    """
    Find duplicate files by comparing hashes.
    Returns dict mapping hash to list of file paths.
    """
    hash_map = defaultdict(list)
    
    for file_path in raw_files:
        file_hash = calculate_file_hash(file_path)
        if file_hash:
            hash_map[file_hash].append(file_path)
        
        if progress_callback:
            progress_callback(file_path)
    
    # Filter to only duplicates (hash appears more than once)
    duplicates = {h: paths for h, paths in hash_map.items() if len(paths) > 1}
    
    return duplicates

def generate_report(duplicates, output_path, format='csv'):
    """
    Generate report of duplicate files.
    Supports CSV and JSON formats.
    """
    if format == 'csv':
        with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['Hash', 'File_Count', 'Total_Size_MB', 'File_Paths'])
            
            for file_hash, paths in sorted(duplicates.items(), 
                                          key=lambda x: len(x[1]), 
                                          reverse=True):
                total_size = sum(p.stat().st_size for p in paths) / (1024 * 1024)
                paths_str = ' | '.join(str(p) for p in paths)
                writer.writerow([file_hash[:16], len(paths), f"{total_size:.2f}", paths_str])
    
    elif format == 'json':
        report_data = {
            'scan_date': datetime.now().isoformat(),
            'total_duplicate_sets': len(duplicates),
            'total_duplicate_files': sum(len(paths) for paths in duplicates.values()),
            'duplicates': [
                {
                    'hash': file_hash,
                    'count': len(paths),
                    'size_mb': sum(p.stat().st_size for p in paths) / (1024 * 1024),
                    'files': [str(p) for p in paths]
                }
                for file_hash, paths in duplicates.items()
            ]
        }
        
        with open(output_path, 'w', encoding='utf-8') as jsonfile:
            json.dump(report_data, jsonfile, indent=2)
    
    print(f"\nReport saved to: {output_path}")

def main():
    parser = argparse.ArgumentParser(
        description='Find duplicate RAW files using file hashing',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scan local directory
  python deduplicate_raws.py /path/to/photos --output duplicates.csv
  
  # Scan on Synology NAS with low priority
  nice -n 19 python3 deduplicate_raws.py /volume1/photos --output report.csv
  
  # Generate JSON report
  python deduplicate_raws.py /path/to/photos --output report.json --format json
        """
    )
    
    parser.add_argument('path', help='Root directory to scan for RAW files')
    parser.add_argument('--output', '-o', required=True, help='Output report file path')
    parser.add_argument('--format', '-f', choices=['csv', 'json'], default='csv',
                       help='Report format (default: csv)')
    parser.add_argument('--extensions', '-e', help='Additional RAW extensions (comma-separated)')
    
    args = parser.parse_args()
    
    # Add custom extensions if provided
    if args.extensions:
        for ext in args.extensions.split(','):
            RAW_EXTENSIONS.add(ext.lower().strip())
    
    # Validate paths
    scan_path = Path(args.path)
    if not scan_path.exists():
        print(f"Error: Path does not exist: {scan_path}", file=sys.stderr)
        sys.exit(1)
    
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    print("=" * 70)
    print("RAW File Deduplication Scanner")
    print("=" * 70)
    print(f"Scan path: {scan_path}")
    print(f"Output: {output_path}")
    print(f"Format: {args.format}")
    print(f"Supported extensions: {', '.join(sorted(RAW_EXTENSIONS))}")
    print("=" * 70)
    print()
    
    # Find all RAW files
    start_time = time.time()
    raw_files = find_raw_files(scan_path)
    
    if not raw_files:
        print("No RAW files found!")
        sys.exit(0)
    
    # Find duplicates with progress tracking
    print("\nScanning for duplicates...")
    progress = ProgressTracker(len(raw_files))
    duplicates = find_duplicates(raw_files, progress_callback=progress.update)
    
    elapsed = time.time() - start_time
    
    # Results summary
    print("\n" + "=" * 70)
    print("RESULTS")
    print("=" * 70)
    print(f"Total RAW files scanned: {len(raw_files)}")
    print(f"Duplicate sets found: {len(duplicates)}")
    print(f"Total duplicate files: {sum(len(paths) for paths in duplicates.values())}")
    
    if duplicates:
        total_wasted = sum(
            sum(p.stat().st_size for p in paths[1:]) 
            for paths in duplicates.values()
        ) / (1024 * 1024 * 1024)
        print(f"Wasted storage (duplicates): {total_wasted:.2f} GB")
    
    print(f"Scan time: {elapsed/60:.1f} minutes")
    print("=" * 70)
    
    # Generate report
    if duplicates:
        generate_report(duplicates, output_path, args.format)
        print(f"\n✓ Found {len(duplicates)} sets of duplicates")
        print(f"✓ Review the report at: {output_path}")
    else:
        print("\n✓ No duplicates found - all files are unique!")

if __name__ == '__main__':
    main()
