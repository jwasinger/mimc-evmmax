import json
import sys


evm_trace_json_file = sys.argv[1]
evm256_trace_json_file = sys.argv[2]

def count_ops(file_path):
    counts = {}
    with open(file_path) as f:
        lines = f.readlines()
        for line in lines:
            line = json.loads(line)
            if not 'opName' in line:
                continue

            if line['opName'] in counts:
                counts[line['opName']] += 1
            else:
                counts[line['opName']] = 1

    return counts

def merge_counts(counts1, counts2):
    result_counts = {}

    for name, count in counts1.items():
        if not name in result_counts:
            result_counts[name] = [count, 0]
        else:
            raise Exception("fuck1")

    for name, count in counts2.items():
        if not name in result_counts:
            result_counts[name] = [0, count]
        else:
            result_counts[name][1] = count

    return result_counts

counts_evm = count_ops(evm_trace_json_file)
print(counts_evm)

counts_evm256 = count_ops(evm256_trace_json_file)
print(counts_evm256)

merged = merge_counts(counts_evm, counts_evm256)

for k, v in merged.items():
    print("{} | {} | {}".format(k, v[0], v[1]))
