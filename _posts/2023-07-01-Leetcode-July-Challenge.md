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

<span class="macaron">嗨嗨嗨！！勋章来咯！！</span>

<img src="https://leetcode.com/static/images/badges/2023/gif/2023-07.gif" class="align-center" width="200">

# `01` [Maximum Number of Achievable Transfer Requests](https://leetcode.com/problems/maximum-number-of-achievable-transfer-requests/description)
`Hard` `DFS`

> You are given an integer array `cookies`, where `cookies[i]` denotes the number of cookies in the `ith` bag. You are also given an integer `k` that denotes the number of children to distribute **all** the bags of cookies to. All the cookies in the same bag must go to the same child and cannot be split up.
> 
> The **unfairness** of a distribution is defined as the maximum total cookies obtained by a single child in the distribution.
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

# `02` [Fair Distribution of Cookies](https://leetcode.com/problems/fair-distribution-of-cookies/)
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

# `03` [Buddy Strings](https://leetcode.com/problems/buddy-strings/)
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
# `04` [Single Number II](https://leetcode.com/problems/single-number-ii/)
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

# `05` [Longest Subarray of 1's After Deleting One Element](https://leetcode.com/problems/longest-subarray-of-1s-after-deleting-one-element/)
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

# `06` [Minimum Size Subarray Sum](https://leetcode.com/problems/minimum-size-subarray-sum/)
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

# `07` [Maximize the Confusion of an Exam](https://leetcode.com/problems/maximize-the-confusion-of-an-exam/)
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

# `08` [Put Marbles in Bags](https://leetcode.com/problems/put-marbles-in-bags/)
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

# `09` [Substring With Largest Variance](https://leetcode.com/problems/substring-with-largest-variance/)
`Hard` `DP`

Finally an interesting question. Good for Leetcode 😌. 
{: .notice--success}

> The *variance* of a string is defined as the largest difference between the number of occurrences of any 2 characters present in the string. Note the two characters may or may not be the same.
>
> Given a string `s` consisting of lowercase English letters only, return the largest variance possible among all substrings of `s`.
>
> A *substring* is a contiguous sequence of characters within a string.

**Constraints** $1 \leq s.length \leq 10^4$

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

# `10` [Minium Depth of Binary Tree](https://leetcode.com/problems/minimum-depth-of-binary-tree/)
`Easy` `Tree`

> Given a binary tree, find its minimum depth.
>
> The minimum depth is the number of nodes along the shortest path from the root node down to the nearest leaf node.

水，注意number of nodes可以是0。下一题。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def minDepth(self, root: Optional[TreeNode]) -> int:
        if not root: return 0
        ans = 0
        queue = [root]
        ne = root
        while queue:
            now = queue.pop(0)
            if now==ne: ans+=1
            if now.left==None and now.right==None: return(ans)
            if now.left: queue.append(now.left)
            if now.right: queue.append(now.right)
            if now==ne:
                if now.left:
                    ne=now.left
                else:
                    ne=now.right

```

# `11` [All Nodes Distance K in Binary Tree](https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree)
`Medium` `Tree` `BFS`

> Given the root of a binary tree, the value of a target node `target`, and an integer `k`, return an array of the values of all nodes that have a distance `k` from the target node.

Classic BFS. Simple variation of yesterday's question. Beat 8% in time, because just finished Mission Impossible and too exhuasted to optimise the algo.

```python
class Solution:
    def distanceK(self, root: TreeNode, target: TreeNode, k: int) -> List[int]:
        queue = [root]
        fathers = {root: None}
        distance = [0 for _ in range(1000)]
        while queue:
            now = queue.pop(0)
            if now.left:
                queue.append(now.left)
                fathers[now.left] = now
            if now.right:
                queue.append(now.right)
                fathers[now.right] = now
        ans = []
        queue = [target]
        hasVisited = []
        distance[target.val] = 0
        while queue:
            now = queue.pop(0)
            hasVisited.append(now.val)
            if distance[now.val]==k: ans.append(now.val)
            for x in [now.left,now.right,fathers[now]]:
                if x==None: continue
                if x.val in hasVisited: continue
                queue.append(x)
                distance[x.val] = distance[now.val] + 1
        return(ans)
```

# `12` [Find Eventual Safe States](https://leetcode.com/problems/find-eventual-safe-states/)
`Medium` `DFS`

> There is a directed graph of n nodes with each node labeled from 0 to n - 1. The graph is represented by a 0-indexed 2D integer array `graph` where `graph[i]` is an integer array of nodes adjacent to node i, meaning there is an edge from node i to each node in `graph[i]`.
> 
> A node is a **terminal** node if there are no outgoing edges. A node is a **safe** node if every possible path starting from that node leads to a **terminal** node (or another safe node).
>
> Return an array containing all the safe nodes of the graph. The answer should be sorted in ascending order.

Classic DFS question. Nothing much to explain.

```python
class Solution:
    def eventualSafeNodes(self, graph: List[List[int]]) -> List[int]:
        n = len(graph)
        safe, ans = {}, []
        def dfs(now: int):
            if now in safe: return safe[now]
            safe[now] = False
            for adj in graph[now]:
                if dfs(adj)==False: return(safe[now])
            safe[now] = True
            return safe[now]
        for i in range(n):
            if dfs(i): ans.append(i)
        return(ans)
```

# `13` [Course Schedule](https://leetcode.com/problems/course-schedule)
`Medium` `Topological Sort` `DFS`

> There are a total of `numCourses` courses you have to take, labeled from 0 to `numCourses-1`. You are given an array `prerequisites` where `prerequisites[i] = [ai, bi]` indicates that you must take course `bi` first if you want to take course `ai`.
>
> - For example, the pair $[0, 1]$, indicates that to take course 0 you have to first take course 1.
> 
> Return `true` if you can finish all courses. Otherwise, return `false`.

```python
class Solution:
    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
        adj = [[] for _ in range(numCourses)]
        for end, start in prerequisites:
            # b first before a, so b->a
            adj[start].append(end)
        status = [0] * numCourses
        #status: 0 not yet, -1 processing, 1 done
        def isCycle(now):
            # processing(-1): cycle; done(1): nope
            if status[now]: return status[now]==-1
            status[now] = -1
            for v in adj[now]:
                if isCycle(v): return True
            status[now] = 1
            return False
        for v in range(numCourses):
            if isCycle(v): return False
        return True
```

# `14` [Longest Arithmetic Subsequence of Given Difference](https://leetcode.com/problems/longest-arithmetic-subsequence-of-given-difference/)
`Medium` `Greedy`

> Given an integer array `arr` and an integer `difference`, return the length of the longest subsequence in `arr` which is an arithmetic sequence such that the difference between adjacent elements in the subsequence equals `difference`.
>
> A subsequence is a sequence that can be derived from arr by deleting some or no elements without changing the order of the remaining elements.

straightforward greedy. Use dict to collect nums.
```python
class Solution:
    def longestSubsequence(self, arr: List[int], difference: int) -> int:
        prevLoc, ans = {}, 1
        for i in arr:
            if i-difference in prevLoc:
                cur = prevLoc[i-difference] + 1
                if i in prevLoc:
                    prevLoc[i] = max(prevLoc[i], cur)
                else:
                    prevLoc[i] = cur
            else:
                if i not in prevLoc: prevLoc[i] = 1
            if prevLoc[i]>ans: ans=prevLoc[i]
        return ans
```

# `15` [Maximum Number of Events That Can Be Attended II](https://leetcode.com/problems/maximum-number-of-events-that-can-be-attended-ii)
`Hard` `DP`

> You are given an array of events where `events[i]` = `[startDayi, endDayi, valuei]`. The ith event starts at `startDayi` and ends at `endDayi`, and if you attend this event, you will receive a value of `valuei`. You are also given an integer `k` which represents the maximum number of events you can attend.
>
> You can only attend one event at a time. If you choose to attend an event, you must attend the entire event. Note that the end day is inclusive: that is, you cannot attend two events where one of them starts and the other ends on the same day.
>
> Return the maximum sum of values that you can receive by attending events.

**Constraints** $1\leq k * events.length \leq 10^6$

一眼DP。然后把数据量看成`1≤k≤events.length≤10^6`，然后想了一年啊这怎么可能$O(n)$做啊啊啊啊，然后发现原来就是简单DP。 $dp[i][j]$前i件选j件的max。

```python
class Solution:
    def maxValue(self, events: List[List[int]], k: int) -> int:
        events.sort(key=lambda x: x[1])
        terminates = [x[1] for x in events]
        @lru_cache(None)
        def dp(i, j):
            if i<0 or j==0: return 0
            startat = bisect.bisect_left(terminates, events[i][0])-1
            return max(dp(startat,j-1)+events[i][2], dp(i-1,j))
        return dp(len(events)-1,k)
```

# `16` [Smallest Sufficient Team](https://leetcode.com/problems/smallest-sufficient-team)
`Hard` `Bitmask` `DFS`

> In a project, you have a list of required skills `req_skills`, and a list of people. The ith person `people[i]` contains a list of skills that the person has.
>
> Consider a sufficient team: a set of people such that for every required skill in `req_skills`, there is at least one person in the team who has that skill. We can represent these teams by the index of each person.
> 
> Return any sufficient team of the smallest possible size, represented by the index of each person. You may return the answer in any order. It is guaranteed an answer exists.

**Constraints** 
- $1 \leq req\_ skills.length \leq 16$
- $1 \leq people.length \leq 60$
- All the strings of `people[i]` are unique.
- Every skill in `people[i]` is a skill in `req_skills`.

A nice heavy-coding problem I would say. Most tricky in this month so far :).

## The Set Cover Problem
The question's model is [set cover problem](https://en.wikipedia.org/wiki/Set_cover_problem), which is NP complete, hence no exact polynomial-time solutions. Appropriate [greedy algorithms](https://en.wikipedia.org/wiki/Set_cover_problem#Greedy_algorithm) can optimise the time complexity to approximately polynomial.

## The Optimisation
Indeed, we never no if we have achieved the minimal answer until searched all possible combinations. Therefore, the key is to constrain the *possible combinations* set:

1. create `skillsWho`
2. use *bitmask* and bit operations to speed up set union and zero check processes.
3. discard useless people (🐠) that are skills-dominated by others.
4. constrain the initial search to the skill with fewest people having it
5. Sort elements of `skillsWho` according to the descending orders of number of skills they have.

Note that 4️⃣ and 5️⃣ do not cut every corner. They speed up the convergence by finding a smaller `ans` earlier. *(essence of this greedy idea: we tend to desire people covering more skills)*

```python
class Solution:
    def smallestSufficientTeam(self, req_skills: List[str], people: List[List[str]]) -> List[int]:
        n = len(people)
        n_skills = len(req_skills)
        ans = [x for x in range(n)]
        for i, p in enumerate(people):
            people[i] = set(p)
        # discard useless
        for i, p1 in enumerate(people):
            for j, p2 in enumerate(people):
                if i==j: continue
                if p1.issubset(p2):
                    people[i] = set()
        # bitmask people skills
        people_masked = []
        for i in range(n):
            skillset = [(x in people[i]) for x in req_skills]
            sk = 0
            for i in skillset:
                sk = sk*2 + int(i)
            people_masked.append(sk)
        skillsWho = [[] for _ in range(n_skills)] 
        for p in range(n):
            for i in people[p]:
                skillsWho[req_skills.index(i)].append(p)
        for i in range(n_skills):
            skillsWho[i].sort(key=lambda x: -len(people[x]))
        
        def complete(now) -> int: 
            #-1 complete; otherwise first '0' loc
            skills = 0
            for x in now:
                skills = skills | people_masked[x]
            if skills == 2**n_skills-1:
                return -1
            else:
                bitmask = ""
                while skills>0:
                    bitmask = str(skills%2) + bitmask
                    skills = skills // 2
                bitmask = bitmask.zfill(n_skills)
                return bitmask.find("0")
        def dfs(now):
            nonlocal ans
            if len(now)>=len(ans): return
            nex = complete(now)
            print(now,nex)
            if nex==-1:
                ans = now
                return
            else:
                for p in skillsWho[nex]:
                    if p in now: continue
                    dfs(sorted(now+[p]))
        hardest = 0 # start search in the hardest skill
        for i in range(n_skills):
            if len(skillsWho[i])<len(skillsWho[hardest]): hardest = i

        for p1 in skillsWho[hardest]:
            dfs([p1])
        return(ans)
```

# `17` [Add Two Numbers II](https://leetcode.com/problems/add-two-numbers-ii/)
`Medium` `Linked List`

> You are given two non-empty linked lists representing two non-negative integers. The most significant digit comes first and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.
> 
> You may assume the two numbers do not contain any leading zero, except the number 0 itself.
>
> <img src="https://assets.leetcode.com/uploads/2021/04/09/sumii-linked-list.jpg" width="40%">{: .align-center}

Simple coding.

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
        def toLinkedList(n: int) -> ListNode:
            l = None
            while n:
                val = n % 10
                n, l = n // 10, ListNode(val, l)
            return l if l else ListNode()
        def toInt(l: ListNode) -> int:
            n = 0
            while l:
                n=n*10+l.val
                l = l.next
            return n
        return toLinkedList(toInt(l1)+toInt(l2))
```

# `18` [LRU Cache](https://leetcode.com/problems/lru-cache/)
`Medium` `Data Structure`

> Design a data structure that follows the constraints of a [Least Recently Used (LRU) cache](https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU).
>
> Implement the `LRUCache` class:
> 
> - `LRUCache(int capacity)` Initialize the LRU cache with positive size `capacity`.
> - `int get(int key)` Return the value of the `key` if the key exists, otherwise return -1.
> - `void put(int key, int value)` Update the value of the `key` if the `key` exists. Otherwise, add the > key-value pair to the cache. If the number of keys exceeds the `capacity` from this operation, **evict** the least recently used key.
>
> The functions `get` and `put` must each run in `O(1)` average time complexity.

Simple coding. Key to `O(1)` time complexity is
1. Use `dict` to store keys
2. To *store* the newest data, we *refresh* by popping it up and reading it back. Therefore we only need to delete the first element in the dictionary (which can be done by `iter` and `next`).

```python
class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.elementDict = {}
    def get(self, key: int) -> int:
        if key in self.elementDict:
            val = self.elementDict.pop(key)
            self.elementDict[key] = val
            return val
        return -1        
    def put(self, key: int, value: int) -> None:
        if key in self.elementDict:
            self.elementDict.pop(key)
        else:
            if len(self.elementDict) == self.capacity:
                ancient = next(iter(self.elementDict))
                del self.elementDict[ancient]
        self.elementDict[key] = value
```

# `19` [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/)
`Medium` `Greedy`

> Given an array of intervals `intervals` where `intervals[i] = [starti, endi]`, return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.

Greedy. We sort and start from the right, if the current fit in, then we take it, otherwise we drop it.

Fiddling with an example helps to get this idea quickly.

```python
class Solution:
    def eraseOverlapIntervals(self, intervals: List[List[int]]) -> int:
        intervals.sort(key=lambda x: x[0], reverse=True)
        current, drop = intervals[0], 0
        for s, e in intervals[1:]:
            if current[0]>=e:
                current = [s,e]
            else:
                drop+=1
        return(drop)
```

# `20` [Asteroid Collision](https://leetcode.com/problems/asteroid-collision/)
`Medium`

> We are given an array `asteroids` of integers representing asteroids in a row.
>
> For each asteroid, the absolute value represents its size, and the sign represents its direction (positive meaning right, negative meaning left). Each asteroid moves at the same speed.
>
> Find out the state of the asteroids after all collisions. If two asteroids meet, the smaller one will explode. If both are the same size, both will explode. Two asteroids moving in the same direction will never meet.

Simple simulation. We use `cur` to record the current border. On the left of the border is the thing we have dealt with the collision.

Time Complexity should be below $O(n^2)$, because of potentially going to the end and going back.

```python
class Solution:
    def asteroidCollision(self, asteroids: List[int]) -> List[int]:
        cur = 0
        for i in range(len(asteroids)):
            while cur and asteroids[cur-1]>0 and asteroids[i]<0 and abs(asteroids[cur-1])<abs(asteroids[i]):
                cur-=1#crush
            if asteroids[i]>0 or asteroids[cur-1]<0 or cur==0:
                asteroids[cur] = asteroids[i]
                cur+=1
            elif asteroids[cur-1] == abs(asteroids[i]):
                cur-=1
        return asteroids[:cur]
```

# `21` [Number of Longest Increasing Subsequence](https://leetcode.com/problems/number-of-longest-increasing-subsequence/)
`Medium` `DP`
> Given an integer array `nums`, return the **number** of longest increasing subsequences.
>
> Notice that the sequence has to be strictly increasing.

Classic DP. $f[i]$ records the max length of increasing subsequence ending at $i$. Update `count` when finding previous length to be $f[i]-1$.   

```python
class Solution:
    def findNumberOfLIS(self, nums: List[int]) -> int:
        n = len(nums)
        f = count = [1]*n 
        for i in range(1,n):
            for j in range(i):
                if nums[i]<=nums[j]: continue
                if f[i] == f[j]+1:
                    count[i]+=count[j]
                elif f[i] < f[j]+1:
                    f[i], count[i] = f[j]+1, count[j]
        ans = max(f)
        return sum(count[i] for i in range(n) if f[i]==ans)
```

# `22` [Knight Probability in Chessboard](https://leetcode.com/problems/knight-probability-in-chessboard/)
`Medium`

> On an n x n chessboard, a knight starts at the cell `(row, column)` and attempts to make exactly `k` moves. The rows and columns are 0-indexed, so the top-left cell is `(0, 0)`, and the bottom-right cell is `(n-1, n-1)`.
>
> A chess knight has eight possible moves it can make, as illustrated below. Each move is two cells in a cardinal direction, then one cell in an orthogonal direction.
> 
> <img src="https://assets.leetcode.com/uploads/2018/10/12/knight.png" width="30%">{: .align-center}
> 
> Each time the knight is to move, it chooses one of eight possible moves uniformly at random (even if the piece would go off the chessboard) and moves there.
>
> The knight continues moving until it has made exactly `k` moves or has moved off the chessboard.
>
> Return the probability that the knight remains on the board after it has stopped moving.

Simple coding. Just calculating probabilities step by step.
```python
class Solution:
    def knightProbability(self, n: int, k: int, row: int, column: int) -> float:
        probabilitys = [[0]*n for _ in range(n)]
        probabilitys[row][column] = 1
        jump = [(-2,-1),(-2,1),(-1,-2),(-1,2),(1,-2),(1,2),(2,-1),(2,1)]
        MoveOffProb = 0
        for i in range(k):
            # calculate probability from previous round
            newProbabilitys = [[0]*n for _ in range(n)]
            for r, c in itertools.product(range(n),range(n)):
                for dr, dc in jump:
                    if 0<=r+dr<n and 0<=c+dc<n:
                        newProbabilitys[r+dr][c+dc] += probabilitys[r][c]/8
                    else:
                        MoveOffProb += probabilitys[r][c]/8
            probabilitys = newProbabilitys
        return(1-MoveOffProb)
```

# `23` [All Possible Full Binary Trees](https://leetcode.com/problems/all-possible-full-binary-trees/)
`Medium` `Recursion` `BinaryTree`

> Given an integer n, return a list of all possible full binary trees with `n` nodes. Each node of each tree in the answer must have `Node.val == 0`.
>
> Each element of the answer is the root node of one possible tree. You may return the final list of trees in any order.
>
> A **full binary tree** is a binary tree where each node has exactly 0 or 2 children.

Nothing fancy, just list everything. We create a dictionary `trees` to store all full binary trees with number of node i. Then bottom-up.
```py
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def allPossibleFBT(self, n: int) -> List[Optional[TreeNode]]:
        if not n%2: return []
        trees = defaultdict(list)
        trees[1].append(TreeNode(0))
        t3 = TreeNode(0)
        t3.left = TreeNode(0)
        t3.right = TreeNode(0)
        trees[3].append(t3)
        for i in range(5,n+1,2):
            l,r = 1, i-2
            while r>=1:
                for left_child in trees[l]:
                    for right_child in trees[r]:
                        tree = TreeNode(0)
                        tree.left, tree.right = left_child, right_child
                        trees[i].append(tree)
                r-=2
                l+=2
        return trees[n]
```

# `24` [Pow(x,n)](https://leetcode.com/problems/powx-n/)
`Easy` `DivideandConquer`

> Implement pow(x, n), which calculates `x` raised to the power `n` (i.e., $x^n$).

**Constraints**
- $-100.0 < x < 100.0$
- $-2^{31} \leq n \leq 2^{31}-1$
- $n$ is an integer.
- Either $x$ is not zero or $n > 0$.

Simple coding, could top-down or bottom-up. Here we use `cache()` to cut corners.
```py
class Solution:
    @lru_cache(None)
    def myPow(self, x: float, n: int) -> float:
        if not n: return 1
        elif n==1: return x
        elif n==-1: return 1/x
        return self.myPow(x, n//2) * self.myPow(x, n//2) * self.myPow(x, n%2)
```

# `25` [Peak Index in a Mountain Array](https://leetcode.com/problems/peak-index-in-a-mountain-array/)
`Medium` `BinarySearch`

> An array `arr` is a mountain if the following properties hold:
>
> - `arr.length` >= 3
> - There exists some i with `0 < i < arr.length - 1` such that:
>   - `arr[0] < arr[1] < ... < arr[i - 1] < arr[i]` 
>   - `arr[i] > arr[i + 1] > ... > arr[arr.length - 1]`
> 
> Given a mountain array `arr`, return the index `i` such that `arr[0] < arr[1] < ... < arr[i - 1] < arr[i] > arr[i + 1] > ... > arr[arr.length - 1].`
> 
> You must solve it in `O(log(arr.length))` time complexity.

Nothing worth mentioning binary search.
```py
class Solution:
    def peakIndexInMountainArray(self, arr: List[int]) -> int:
        l,r = 0, len(arr)-1
        while True:
            mid = (l+r)//2
            if arr[mid]>arr[mid-1]:
                if arr[mid]>arr[mid+1]:
                    return mid
                else:
                    l=mid+1
            else:
                r = mid
```

# `26` [Minium Speed to Arrive on Time](https://leetcode.com/problems/minimum-speed-to-arrive-on-time/)
`Medium` `BinarySearch`

> You are given a floating-point number hour, representing the amount of time you have to reach the office. To commute to the office, you must take n trains in sequential order. You are also given an integer array `dist` of length `n`, where `dist[i]` describes the distance (in kilometers) of the ith train ride.
>
> Each train can only depart at an integer hour, so you may need to wait in between each train ride.
>
> - For example, if the 1st train ride takes 1.5 hours, you must wait for an additional 0.5 hours before you can depart on the 2nd train ride at the 2 hour mark.
>
> Return the minimum positive integer speed (in kilometers per hour) that all the trains must travel at for you to reach the office on time, or -1 if it is impossible to be on time.
>
> Tests are generated such that the answer will not exceed $10^7$ and `hour` will have at most two digits after the decimal point.

**Constraints**

- n == dist.length
- $1 \leq n \leq 10^5$
- $1 \leq dist[i] \leq 10^5$
- $1 \leq hour \leq 10^9$
Just read the question carefully. It's only impossible to fulfill when there are more trains than available hours. 

Then we find that, given a speed, we can quickly verify whether it can fulfill the task. So we binary search the possible speeds.

```py
class Solution:
    def minSpeedOnTime(self, dist: List[int], hour: float) -> int:
        if hour+1 <= len(dist): return -1
        l, r = 1, max(dist)
        if hour%1!=0:
            r = max(r, dist[-1]//(hour-int(hour))+1)
        while l<r:
            mid = (l+r)//2
            need = sum(i//mid + (i%mid!=0) for i in dist[:-1]) + dist[-1]/mid
            if need<=hour:
                r=mid
            else:
                l = mid+1
        return int(l)
```

# `27` [Maximum Running Time of N Computers](https://leetcode.com/problems/maximum-running-time-of-n-computers/)
`Hard` `BinarySearch` `Greedy`

> You have n computers. You are given the integer `n` and a 0-indexed integer array batteries where the ith battery can run a computer for `batteries[i]` minutes. You are interested in running all n computers simultaneously using the given batteries.
> 
> Initially, you can insert at most one battery into each computer. After that and at any integer time moment, you can remove a battery from a computer and insert another battery **any number of times**. The inserted battery can be a totally new battery or a battery from another computer. You may assume that the removing and inserting processes take no time.
>
> Note that the batteries cannot be recharged.
> 
> Return the maximum number of minutes you can run all the `n` computers simultaneously.

Hard to proceed at first. Then by a greedy idea, we discover it's easy to check whether a `life` is viable (shown in the function `check`). Then we just binary search the `life`.
```py
class Solution:
    def maxRunTime(self, n: int, batteries: List[int]) -> int:
        l = 1
        r = sum(batteries) // n
        def check(life: int) -> bool:
            return sum([min(x, life) for x in batteries])>=n*life
        while l<=r:
            mid = (l+r)//2
            if check(mid):
                l=mid+1
            else:
                r=mid-1
        return r
```

# `28` [Predict the Winner](https://leetcode.com/problems/predict-the-winner/)
`Medium` `DP` `Recursion`

> You are given an integer array nums. Two players are playing a game with this array: player 1 and player 2.
> 
> Player 1 and player 2 take turns, with player 1 starting first. Both players start the game with a score of 0. At each turn, the player takes one of the numbers from either end of the array (i.e., `nums[0]` or `nums[nums.length - 1]`) which reduces the size of the array by 1. The player adds the chosen number to their score. The game ends when there are no more elements in the array.
>
> Return <span class="macaron">true</span> if Player 1 can win the game. If the scores of both players are equal, then player 1 is still the winner, and you should also return true. You may assume that both players are playing optimally.

总感觉以前哪里做过。。是HRT还是XTX的面试题吗😶

Simple DP. The idea is:
- if it's our turn, we must win iff one of the actions lead to a must-win (so `or`).
- if it's opponent's turn, we must win iff no matter what the opponent takes, we still win (so `and`).
Then it's clearly DP. Edge situation easy to handle. Again `lru_cache` to cut corners.

```py
class Solution:
    def PredictTheWinner(self, nums: List[int]) -> bool:
        @lru_cache(None)
        def search(l: int,r: int,score1: int,score2: int, now1: bool) -> bool:
            nonlocal nums
            if l>r: return score1>=score2
            if now1:
                return search(l+1, r, score1+nums[l], score2, False) or search(l,r-1,score1+nums[r],score2,False)
            else:
                return search(l+1, r, score1, score2+nums[l], True) and search(l,r-1,score1,score2+nums[r],True)
        return search(0,len(nums)-1,0,0,True)
```

# `29` [Soup Servings](https://leetcode.com/problems/soup-servings/)
`Medium` `DP`

`ti mu tai chang le, bu xiang ban yun.`
just simple DP. Nothing to say.

```py
class Solution:
    def soupServings(self, n: int) -> float:
        @lru_cache(None)
        def dfs(a,b):
            if a<=0 and b<=0:
                return 0.5
            elif a<=0:
                return 1
            elif b<=0:
                return 0
            return 0.25*(dfs(a-100,b)+dfs(a-75,b-25)+dfs(a-50,b-50)+dfs(a-25,b-75))
        if n>=4451:
            return 1
        else:
            return dfs(n,n)
```

# `30` [Strange Printer](https://leetcode.com/problems/strange-printer/)
`Hard` `DP`

> There is a strange printer with the following two special properties:
> 
> - The printer can only print a sequence of the same character each time.
> - At each turn, the printer can print new characters starting from and ending at any place and will cover the original existing characters.
>
> Given a string `s`, return the minimum number of turns the printer needed to print it.

DP is clear. How to proceed DP is hard. We consider **how many steps we take to change a string `s` from the form aaaaaa where `a` is `s`'s end, to `s`. 

**Key idea**: there always exists an optimal strategy, where at each operation we use the printer to change the section of letters to its ending letter. i.e. change `s[start:end+1]` to `s[end] * (end-start+1)`. Just argue by contradiction.

Then with this idea we can divide the problem into subproblems, thus proceeding DP. 

I think the [solution](https://leetcode.com/problems/strange-printer/editorial/) explains the idea very clearly.
```py
class Solution:
    def strangePrinter(self, s: str) -> int:
        nextDiffIndex, prevDiffIndex = [-1] * len(s), [-1] * len(s)
        for i in range(len(s)-2, -1, -1):
            if s[i]!=s[i+1]:
                nextDiffIndex[i] = i+1
            else:
                nextDiffIndex[i] = nextDiffIndex[i+1]
        for i in range(1, len(s)):
            if s[i]!=s[i-1]:
                prevDiffIndex[i] = i-1
            else:
                prevDiffIndex[i] = prevDiffIndex[i-1]
        @lru_cache(None)
        def dp(start, end) -> int:
            #dp[l][r] = dp[j][i] + dp[i+1][r] + 1 for optimal i
            # we assume we already have s[end]
            if len(set(s[start:end+1])) == 1: return 0
            next = nextDiffIndex[start] if s[start]==s[end] else start
            if next == prevDiffIndex[end]: return 1
            return 1 + min([dp(next, nextend)+dp(nextend+1, end) for nextend in range(next, end)])
        return 1+dp(0, len(s)-1)        
```

Finished this problem at a Stabucks in Bilbao, with a broken leg. Apparently the Spanish add sugars to cold brew.
{: .notice--info}


# `31` [Minimum ASCII Delete Sum for Two Strings](https://leetcode.com/problems/minimum-ascii-delete-sum-for-two-strings/)
`Medium` `DP`

> Given two strings `s1` and `s2`, return the lowest ASCII sum of deleted characters to make two strings equal.

**Constraints** $1 \leq s1.length,\, s2.length \leq 1000$

A classic DP problem. Consider `dp(i,j)` to be the answer of `s1[i:]` and `s2[j:]`.
```py
class Solution:
    def minimumDeleteSum(self, s1: str, s2: str) -> int:
        @lru_cache(None)
        def dp(i, j) -> int:
            # ans since [i:] and [j:]
            nonlocal s1,s2
            if i==len(s1) and j==len(s2): return 0
            if i==len(s1) and j<len(s2):
                return sum([ord(x) for x in s2[j:]])
            if i<len(s1) and j==len(s2):
                return sum([ord(x) for x in s1[i:]])
            if s1[i]==s2[j]: return dp(i+1,j+1)
            return min(ord(s1[i])+dp(i+1,j), ord(s2[j])+dp(i,j+1))
        return dp(0,0)
```

<span class="macaron">**Jul LeetCoding Challenge COMPLETED**</span>