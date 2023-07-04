---
tags:
  - DFS
  - Heap
  - Leetcode-Medium
share: false
title: "Leetcode July Daily Challenges"
excerpt: "QSD is actually rewatching Agnets of SHIELD @`July 2`. 'Will I get my Skye back?'"
---

# `20230701` [Maximum Number of Achievable Transfer Requests](https://leetcode.com/problems/maximum-number-of-achievable-transfer-requests/description)
`Medium` `DFS`
You are given an integer array `cookies`, where `cookies[i]` denotes the number of cookies in the `ith` bag. You are also given an integer `k` that denotes the number of children to distribute **all** the bags of cookies to. All the cookies in the same bag must go to the same child and cannot be split up.

The **unfairness** of a distribution is defined as the **maximum** **total** cookies obtained by a single child in the distribution.

Return _the **minimum** unfairness of all distributions_.

## Basic Idea: DFS
A counterexample where Greedy fails can be easily constructed. We observe the constraint that `2 <= cookies.length <= 8`, hence the clue of using DFS.

The idea is to iterate the `cookies`. Each time we distribute this `cookies` to any possible children, and go to the next layer of DFS.
```python
class Solution:
    def distributeCookies(self, cookies: List[int], k: int) -> int:
		ans = sum(cookies)
        
        def searchCandies(i, children, current_max):
            nonlocal ans
            # children records the current candies each child has
            # current_max records the local answer
            if i>=len(cookies):
                ans = min(ans, current_max)
                return
            for child_id in range(len(children)):
                # we assign the cookie to child i
                if children[child_id]+cookies[i] >= ans: continue
                children[child_id] += cookies[i]
                searchCandies(i+1, children,  
                max(current_max, children[child_id]))
                children[child_id] -= cookies[i]
        searchCandies(0, [0]*k, 0)
        return ans
```

### Optimise: Early Stop
```python
if children[child_id]+cookies[i] >= ans: continue
```
The `ans` is an existing local solution. So there is no point to do further DFS if the current distribution plan has a larger unfairness.

### Caution: `nonlocal`
If you delete `nonlocal` in code, an error emerges: `UnboundLocalError: local variable 'ans' referenced before assignment`.
This is because Python does not know the `ans` variable in our `searchCandies` function. It will consider it as a local variable, hence creating a new `ans` inside the function - this explains the description of this error.

There are two ways to get around this. First is this `nonlocal` argument. The second is to move `ans` to the `Solution` class. i.e. define `ans` (and use it) in the form of `self.ans`.

## Further Optimisation
An idea is to have a better starting point. We use `heap` to formulate a *greedy* solution: Each time we assign a cookie to the child with least number of cookies. This has constant time cost (because the number of cookies smaller than 8), but will give a very nice upper bound of solution, which cuts lots of leaves in the later DFS.

Simply replace the `ans = sum(cookies)` with this:
```python
cookies.sort(reverse = True)
heap = [0] * k
for i in cookies:
	currentLeastChild = heapq.heappop(heap)
	currentLeastChild += i
	heapq.heappush(heap,currentLeastChild)
ans = max(heap)
```
- `sort` is again optional, but basically costs no time.
- This gives the fastest solution on Leetcode.s

# `20230702` [Fair Distribution of Cookies](https://leetcode.com/problems/fair-distribution-of-cookies/)
`Hard` `DFS` `Divide and Conquer`
- Use `bitMask` to search request cases
- There's a very nice article about how to optimise by divide and conquer *path lengths*.
```python
class Solution:
    def maximumRequests(self, n: int, requests: List[List[int]]) -> int:
        def bitmaskToBool(n):
            bitsOn = []
            while n:
                bitsOn.append(n%2==1)
                n = n//2
            return(bitsOn)
        ans = 0
        for mask in range(1, (1<<len(requests))):
            bitsOn = bitmaskToBool(mask)
            pathLength = sum(bitsOn)
            if pathLength<=ans: continue

            indeg = [0 for _ in range(n)]
            for i in range(len(bitsOn)):
                if not bitsOn[i]: continue
                req = requests[i]
                indeg[req[0]]-=1
                indeg[req[1]]+=1
            if all([x==0 for x in indeg]):
                ans = max(ans, pathLength)
        return(ans)
```
# `20230703` [Buddy Strings](https://leetcode.com/problems/buddy-strings/)
`easy` `silly`
纯笨b摆烂天把所有情况想明白就完事了没什么好说的题目.
```python
class Solution:
    def buddyStrings(self, s: str, goal: str) -> bool:
        if len(s)!=len(goal) or len(s)<=1: return(False)
        if len(s)==2:
            return (s[0]==goal[1] and s[1]==goal[0])
        diff = -1
        for i in range(len(s)):
            if s[i]!=goal[i]:
                if diff==-2: return(False) #two pairs differ
                if diff==-1: # no pair differs
                    diff = i
                else: # diff = i, one pair differs
                    if not(s[diff]==goal[i] and s[i]==goal[diff]):
                        return(False)
                    else:
                        diff=-2
        if diff == -1:  # all same
            return not len(set(s))==len(s)
        elif diff == -2:
            return True
        else:
            return False 
```
# `20230704` [Single Number II](https://leetcode.com/problems/single-number-ii/)
`Medium` `Array` `Bit Manipulation`
Use idea of `XOR`. The logic is a bit confusing, better take some numbers and try for yourself 🙂.
```python
class Solution:
    def singleNumber(self, nums: List[int]) -> int:
        a, b = 0, 0
        for i in nums:
            a = (a^i) & ~b
            b = (b^i) & ~a
        return a
```