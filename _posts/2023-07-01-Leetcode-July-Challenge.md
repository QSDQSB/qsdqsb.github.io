---
tags:
  - DFS
  - Heap
  - Leetcode-Medium
share: false
title: "Leetcode July Daily Challenges"
excerpt: "QSD is actually rewatching Agnets of SHIELD @`July 2`. 'Will I get my Skye back?'"
header:
  overlay_image: flight-sunrise-3v1.jpg
---

# `20230701` [Maximum Number of Achievable Transfer Requests](https://leetcode.com/problems/maximum-number-of-achievable-transfer-requests/description)
`Hard` `DFS`

> You are given an integer array `cookies`, where `cookies[i]` denotes the number of cookies in the `ith` bag. You are also given an integer `k` that denotes the number of children to distribute **all** the bags of cookies to. All the cookies in the same bag must go to the same child and cannot be split up.
> 
> The **unfairness** of a distribution is defined as the maximum total cookies obtained by a single child in the distribution.
> 
> Return _the **minimum** unfairness of all distributions_.

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
`Easy` `Silly`

纯笨b摆烂天把所有情况想明白就完事了没什么好说的题目😅.
{: .notice--warning}

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

# `20230705` [Longest Subarray of 1's After Deleting One Element](https://leetcode.com/problems/longest-subarray-of-1s-after-deleting-one-element/)
`Medium` `Array` `Greedy`

> Given a binary array `nums`, you should delete **one** element from it.
>
> Return the size of the longest non-empty subarray containing only 1's in the resulting array. Return 0 if there is no such subarray.

---

不是，您每天出这种题目，您图啥呢？Simply 贪心。
```python
class Solution:
    def longestSubarray(self, nums: List[int]) -> int:
        if len(nums)==1: return(0)
        if 0 not in nums: return(len(nums)-1)
        current_max = now_len = prev_len = 0
        for i in range(len(nums)):
            if not nums[i]:
                current_max = max(current_max, prev_len + now_len)
                if i==len(nums)-1: return current_max
                
                if nums[i+1]:
                    prev_len = now_len
                    now_len = 0
                else:
                    prev_len = now_len = 0
            else:
                if now_len>current_max: current_max = now_len
                now_len+=1
        return(max(current_max, prev_len+now_len))
```

# `20230706` [Minimum Size Subarray Sum](https://leetcode.com/problems/minimum-size-subarray-sum/)
`Medium` `Pointer` `Array`

> Given an array of positive integers `nums` and a positive integer `target`, return the minimal length of a subarray whose sum is greater than or equal to target. If there is no such subarray, return 0 instead.

---

普及组第一题都不敢出这么简单的级别泥🤧two pointers O(n)完事泥.
```python
class Solution:
    def minSubArrayLen(self, target: int, nums: List[int]) -> int:
        left = now = 0
        ans = len(nums)+1
        for i in range(len(nums)):
            now+=nums[i]
            if now>=target:
                while now-nums[left]>=target:
                    now-=nums[left]
                    left+=1
                ans = min(ans, i-left+1)
        return(0 if ans==len(nums)+1 else ans)    
```

# `20230707` [Maximize the Confusion of an Exam](https://leetcode.com/problems/maximize-the-confusion-of-an-exam/)
`Medium` `Pointer` `Greedy`

> A teacher is writing a test with n true/false questions, with 'T' denoting true and 'F' denoting false. He wants to confuse the students by maximizing the number of consecutive questions with the same answer (multiple trues or multiple falses in a row).
>
> You are given a string `answerKey`, where `answerKey[i]` is the original answer to the ith question. In addition, you are given an integer `k`, the maximum number of times you may perform the following operation:
>
> Change the answer key for any question to 'T' or 'F' (i.e., set `answerKey[i]` to 'T' or 'F').
Return the maximum number of consecutive 'T's or 'F's in the answer key after performing the operation at most k times.

---

Simple greedy. No point not exploiting all `k`s if possible. Simply use a pointer `l` to indicate the current left position. If surpassed then adjust left to the closest.

```python
class Solution:
    def maxConsecutiveAnswers(self, answerKey: str, k: int) -> int:
        ans = 0
        for c in ['T','F']:
            l = current = count = 0
            for i in range(len(answerKey)):
                if answerKey[i]==c: count+=1 # WT replace c
                while count > k: #don't want the left
                    if answerKey[l]==c: count-=1
                    l+=1
                current = max(current, i-l+1)
            ans = max(ans,current)
        return(ans)
```

今天的双周赛好水啊，就跟Leetcode的服务器一样😌。
{: .notice--info}

# `20230708` [Put Marbles in Bags](https://leetcode.com/problems/put-marbles-in-bags/)
`Hard` `Greedy` 

> You have k bags. You are given a 0-indexed integer array `weights` where `weights[i]` is the weight of the ith marble. You are also given the integer `k`.
>
> Divide the marbles into the `k` bags according to the following rules:
>
> - No bag is empty.
> - If the ith marble and jth marble are in a bag, then all marbles with an index between the ith and jth indices should also be in that same bag.
> - If a bag consists of all the marbles with an index from i to j inclusively, then the cost of the bag is `weights[i] + weights[j]`.
The score after distributing the marbles is the sum of the costs of all the k bags.
> 
> Return the difference between the maximum and minimum scores among marble distributions.

**Constraints**
- 1 <= $k$ <= weights.length <= $10^5$
- 1 <= weights[i] <= $10^9$

---

It's easy to think about taking a sum of neighbours and try to locate extreme situations among them. Two things to consider: `1` the boundary of arrays `2` the one-element groups. The first is easy to figure out, because in max and min cases the 0th and -1th element has to be included in the cost, so it cancel out.

For the second, take a neighbour sum (e.g. `np.array(weights[1:]) + np.array(weights[:-1])`). You will find out that **the partition is actually bijective to taking $k-1$ elements from neighbour-sum.**

Didn't use `numpy`, as importing is slow, and wanna beat as many people as possible for QSD's bizzard dignity.

<img src="https://cdn.mathpix.com/snip/images/yoE8v7U7edv8jME1K_clSUXu4suNRBbtb60vw8bPhcE.original.fullsize.png"  width="50%">{: .align-center}

```python
class Solution:
    def putMarbles(self, weights: List[int], k: int) -> int:
        if k==1: return(0)
        neighbourSumWeights = sorted([weights[i] + weights[i+1] for i in range(len(weights)-1)])
        return(sum(neighbourSumWeights[-(k-1):])-sum(neighbourSumWeights[:(k-1)]))
```

# `20230709` [Substring With Largest Variance](https://leetcode.com/problems/substring-with-largest-variance/)
`Hard` `DP`

Finally an interesting question. Good for Leetcode 😌. 
{: .notice--success}

> The *variance* of a string is defined as the largest difference between the number of occurrences of any 2 characters present in the string. Note the two characters may or may not be the same.
>
> Given a string `s` consisting of lowercase English letters only, return the largest variance possible among all substrings of `s`.
>
> A *substring* is a contiguous sequence of characters within a string.

**Constraints**
1 <= s.length <= $10^4$

---

Classical DP question (as the data constraint suggests). The first idea is to 
    1. iterate the two letters among all letters.
    2. count the occurrence among all possible substrings of `s`.  

This is clearly TLE. Then `DP` naturally comes up to skip unncessary sub-problems during Step 2. The *difference of occurrence between two letters* is then linked to [Kadane's Algorithm](https://www.geeksforgeeks.org/largest-sum-contiguous-subarray/) (The classical $O(n)$ solution to **Largest Sum Contiguous Subarray** problem).

> One problem remains is the situation of $abb$, which, as we reset the difference to 0 to find the optimal solution in Kadane, results in answer `0`. The convenient solution is to calculate again for `s[::-1]`. *(Further optimisation for this clearly exists as the overlapping of calculation, but only provides constant optimisation for time complexity)*

`time complexity` $26^2*\text{len}(s)$

```python
class Solution:
    def largestVariance(self, s: str) -> int:
        letters = set(s)
        if len(letters)==1: return(0)
        ans = 0
        for a in letters:
            for b in letters:
                if a==b: continue
                for sSs in [s,s[::-1]]:
                    curMax = countA = countB = 0
                    for letter in sSs:
                        if letter not in [a,b]: continue
                        countA+= (letter==a)
                        countB+= (letter==b)
                        if countA<countB: countA = countB = 0
                        if countA*countB: curMax = max(curMax, countA-countB)
                    ans = max(ans, curMax)
        return(ans)
```