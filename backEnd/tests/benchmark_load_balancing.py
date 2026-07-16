"""
Script benchmark_load_balancing.py — Đo dac Delta truoc/sau khi ap dung Load Balancing trong DEEP mode (GA).

Chay:
    .\\KLTN_2026\\Scripts\\python.exe tests/benchmark_load_balancing.py

Muc tieu:
Kiem tra xem viec them compute_weight_balance() vao fitness_func co thuc su
lam giam khoang cach tu Center of Gravity (CoG) den tam thung xe hay khong,
va su danh doi (trade-off) ve Fill Rate la bao nhieu.
"""
import sys, os, datetime, time
import numpy as np
import pygad

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app.core.packer import GravityPacker, GravityBin
from py3dbp import Item

PACK_KWARGS = dict(bigger_first=False, distribute_items=False, number_of_decimals=0)


def run_benchmark(bin_dims, items_spec, balance_weight=0.0):
    bw, bh, bd, bmw = bin_dims
    bin_vol = bw * bh * bd

    items_data = []
    for i, (name, w, h, d, wt) in enumerate(items_spec):
        items_data.append({"id": name, "length": d, "width": w, "height": h, "weight": wt})
    
    num_items = len(items_data)

    def fitness_func(ga_instance, solution, solution_idx):
        order = np.argsort(solution).tolist()
        ordered = [items_data[i] for i in order]

        p = GravityPacker()
        b = GravityBin("bin", bw, bh, bd, bmw)
        p.add_bin(b)
        
        for item_data in ordered:
            p.add_item(Item(item_data["id"], item_data["width"], item_data["height"], item_data["length"], item_data["weight"]))
        
        p.pack(**PACK_KWARGS)
        
        packed_volume = sum(
            float(i.get_dimension()[0]) * float(i.get_dimension()[1]) * float(i.get_dimension()[2])
            for i in b.items
        )
        fill_rate = (packed_volume / bin_vol) * 100
        
        balance_penalty = b.compute_weight_balance()
        return fill_rate - (balance_penalty * balance_weight)

    ga_instance = pygad.GA(
        num_generations=30,
        num_parents_mating=4,
        fitness_func=fitness_func,
        sol_per_pop=max(8, num_items * 2),
        num_genes=num_items,
        gene_type=float,
        init_range_low=0.0,
        init_range_high=float(num_items),
        mutation_percent_genes=20,
        crossover_type="single_point",
        mutation_type="random",
        keep_parents=2,
        suppress_warnings=True,
    )

    t0 = time.time()
    ga_instance.run()
    t1 = time.time()

    best_solution, best_fitness, _ = ga_instance.best_solution()
    best_order = np.argsort(best_solution).tolist()
    best_ordered = [items_data[i] for i in best_order]

    # Run final
    p_final = GravityPacker()
    b_final = GravityBin("bin", bw, bh, bd, bmw)
    p_final.add_bin(b_final)
    for item_data in best_ordered:
        p_final.add_item(Item(item_data["id"], item_data["width"], item_data["height"], item_data["length"], item_data["weight"]))
    
    p_final.pack(**PACK_KWARGS)

    packed_vol = sum(
        float(i.get_dimension()[0]) * float(i.get_dimension()[1]) * float(i.get_dimension()[2])
        for i in b_final.items
    )
    fill_rate = (packed_vol / bin_vol) * 100
    penalty = b_final.compute_weight_balance()
    
    return fill_rate, penalty, t1 - t0

cases = [
    ("Case 1: Heavy item lech tau (can Load Balance can thiep de chuyen vao tam)",
     (1000, 500, 1000, 9999),
     [
         # Item nang: can phai dua vao tam
         ("HEAVY", 400, 200, 400, 500),
         # Cac item nhe
         ("LIGHT1", 300, 200, 300, 10),
         ("LIGHT2", 300, 200, 300, 10),
         ("LIGHT3", 200, 200, 200, 5),
         ("LIGHT4", 200, 200, 200, 5),
         ("LIGHT5", 200, 200, 200, 5),
         ("LIGHT6", 200, 200, 200, 5),
     ]),
    ("Case 2: Nhieu items bat doi xung, trong luong hon lon",
     (1200, 600, 1200, 9999),
     [
         ("M_HEAVY1", 300, 300, 300, 100),
         ("M_HEAVY2", 300, 300, 300, 100),
         ("S_LIGHT1", 200, 300, 200, 10),
         ("S_LIGHT2", 200, 300, 200, 10),
         ("S_LIGHT3", 200, 300, 200, 10),
         ("S_LIGHT4", 200, 300, 200, 10),
         ("L_LIGHT1", 600, 200, 400, 20),
         ("L_LIGHT2", 400, 200, 600, 20),
     ]),
    ("Case 3: Xep thanh hang ngang, vi tri item nang",
     (600, 200, 200, 9999),
     [
         ("NANG", 200, 200, 200, 1000),
         ("NHE_1", 200, 200, 200, 10),
         ("NHE_2", 200, 200, 200, 10),
     ])
]

print("=" * 60)
print("BENCHMARK LOAD BALANCING (GA DEEP MODE)")
print("=" * 60)
print()

for label, bin_dims, items_spec in cases:
    print(f"--- {label} ---")
    
    # Khong Load Balancing
    f_rate_0, pen_0, t_0 = run_benchmark(bin_dims, items_spec, balance_weight=0.0)
    
    # Co Load Balancing (Trong so = 10.0 -> penalty max ~14 anh huong toi fitness)
    f_rate_10, pen_10, t_10 = run_benchmark(bin_dims, items_spec, balance_weight=10.0)
    
    print(f"  [KHONG CAN BANG] Fill Rate: {f_rate_0:.2f}%, Penalty (CoG Offset): {pen_0:.4f}, Time: {t_0:.2f}s")
    print(f"  [CO CAN BANG]    Fill Rate: {f_rate_10:.2f}%, Penalty (CoG Offset): {pen_10:.4f}, Time: {t_10:.2f}s")
    
    d_fill = f_rate_10 - f_rate_0
    d_pen = pen_0 - pen_10
    print(f"  => Delta Fill Rate: {'+' if d_fill>=0 else ''}{d_fill:.2f}%")
    print(f"  => Giam Offset (Penalty): {d_pen:.4f} ({(d_pen/pen_0*100) if pen_0>0 else 0:.1f}% improvement)")
    print()

print("Hoan tat do dac.")
